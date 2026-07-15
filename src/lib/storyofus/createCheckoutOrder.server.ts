import { createServerFn } from "@tanstack/react-start";

import {
  type StoryOfUsCheckoutContactInput,
  validateStoryOfUsCheckoutContact,
} from "./contactValidation";
import { createShopierPaymentTarget } from "./shopierPayment.server";
import { storyOfUsShopierConfig } from "./shopierConfig.server";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

type CreateCheckoutOrderResult = {
  orderReference: string;
  trackingCode: string;
  customerEmail: string;
  customerName: string;
  contactPhone: string;
  paymentAmount: number;
  paymentCurrency: string;
  shopierPaymentUrl: string;
  needsManualShopierConfig: boolean;
};

const ORDER_REFERENCE_MAX_ATTEMPTS = 8;
const TRACKING_CODE_MAX_ATTEMPTS = 8;

export const createStoryOfUsCheckoutOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): StoryOfUsCheckoutContactInput => {
    if (!data || typeof data !== "object") {
      throw new Error("Checkout iletişim bilgileri eksik.");
    }

    const input = data as Partial<StoryOfUsCheckoutContactInput>;

    return {
      customerName: stringValue(input.customerName),
      customerEmail: stringValue(input.customerEmail),
      confirmCustomerEmail: stringValue(input.confirmCustomerEmail),
      contactPhone: stringValue(input.contactPhone),
      contactConsentAccepted: input.contactConsentAccepted === true,
      emailAccuracyAccepted: input.emailAccuracyAccepted === true,
    };
  })
  .handler(async ({ data }): Promise<CreateCheckoutOrderResult> => {
    const validation = validateStoryOfUsCheckoutContact(data);

    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0] ?? "Lütfen iletişim bilgilerini kontrol edin.");
    }

    const orderReference = await createUniqueOrderReference();
    const trackingCode = await createUniqueTrackingCode();
    const acceptedAt = new Date().toISOString();
    const checkoutExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const paymentAmount = storyOfUsShopierConfig.paymentAmountTry;
    const paymentCurrency = storyOfUsShopierConfig.paymentCurrency;
    const paymentTarget = createShopierPaymentTarget({
      orderReference,
      customerName: validation.normalized.customerName,
      customerEmail: validation.normalized.customerEmail,
      contactPhone: validation.normalized.contactPhone,
      amount: paymentAmount,
      currency: paymentCurrency,
    });

    const { data: insertedSubmission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .insert({
        payment_status: "pending",
        status: "draft",
        customer_name: validation.normalized.customerName,
        customer_email: validation.normalized.customerEmail,
        contact_phone: validation.normalized.contactPhone,
        order_reference: orderReference,
        tracking_code: trackingCode,
        payment_provider: "shopier",
        payment_amount: paymentAmount,
        payment_currency: paymentCurrency,
        checkout_expires_at: checkoutExpiresAt,
        checkout_consents: {
          contactConsentAccepted: {
            accepted: true,
            acceptedAt,
          },
          emailAccuracyAccepted: {
            accepted: true,
            acceptedAt,
          },
        },
      })
      .select(
        "order_reference, tracking_code, customer_email, customer_name, contact_phone, payment_amount, payment_currency",
      )
      .single();

    if (error || !insertedSubmission) {
      throw new Error(`StoryOfUs checkout order could not be created: ${error?.message}`);
    }

    return {
      orderReference: String(insertedSubmission.order_reference),
      trackingCode: String(insertedSubmission.tracking_code),
      customerEmail: String(insertedSubmission.customer_email),
      customerName: String(insertedSubmission.customer_name),
      contactPhone: String(insertedSubmission.contact_phone),
      paymentAmount: Number(insertedSubmission.payment_amount) || paymentTarget.amount,
      paymentCurrency: String(insertedSubmission.payment_currency || paymentTarget.currency),
      shopierPaymentUrl: paymentTarget.paymentUrl,
      needsManualShopierConfig: paymentTarget.needsManualShopierConfig,
    };
  });

async function createUniqueOrderReference() {
  for (let attempt = 0; attempt < ORDER_REFERENCE_MAX_ATTEMPTS; attempt += 1) {
    const orderReference = createOrderReference();
    const { data, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select("id")
      .eq("order_reference", orderReference)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs order reference could not be checked: ${error.message}`);
    }

    if (!data) {
      return orderReference;
    }
  }

  throw new Error("Benzersiz sipariş referansı oluşturulamadı. Lütfen tekrar deneyin.");
}

async function createUniqueTrackingCode() {
  for (let attempt = 0; attempt < TRACKING_CODE_MAX_ATTEMPTS; attempt += 1) {
    const trackingCode = createTrackingCode();
    const { data, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .select("id")
      .eq("tracking_code", trackingCode)
      .maybeSingle();

    if (error) {
      throw new Error(`StoryOfUs tracking code could not be checked: ${error.message}`);
    }

    if (!data) {
      return trackingCode;
    }
  }

  throw new Error("Benzersiz sipariş takip numarası oluşturulamadı. Lütfen tekrar deneyin.");
}

function createOrderReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `SOU-${datePart}-${createRandomCode(6)}`;
}

function createTrackingCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `SOT-${datePart}-${createRandomCode(6)}`;
}

function createRandomCode(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
