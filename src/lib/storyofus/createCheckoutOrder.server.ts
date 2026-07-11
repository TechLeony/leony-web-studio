import { createServerFn } from "@tanstack/react-start";

import { storyOfUsDemoCtaConfig } from "./demoCtaConfig";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";
import {
  type StoryOfUsCheckoutContactInput,
  validateStoryOfUsCheckoutContact,
} from "./contactValidation";

type CreateCheckoutOrderResult = {
  orderReference: string;
  customerEmail: string;
  customerName: string;
  contactPhone: string;
  paymentStatus: "pending";
  shopierPaymentUrl: string;
};

const ORDER_REFERENCE_MAX_ATTEMPTS = 8;

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
    const acceptedAt = new Date().toISOString();

    const { data: insertedSubmission, error } = await storyOfUsSupabaseAdmin
      .from("storyofus_submissions")
      .insert({
        payment_status: "pending",
        status: "draft",
        customer_name: validation.normalized.customerName,
        customer_email: validation.normalized.customerEmail,
        contact_phone: validation.normalized.contactPhone,
        order_reference: orderReference,
        payment_provider: "shopier",
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
      .select("order_reference, customer_email, customer_name, contact_phone, payment_status")
      .single();

    if (error || !insertedSubmission) {
      throw new Error(`StoryOfUs checkout order could not be created: ${error?.message}`);
    }

    return {
      orderReference: String(insertedSubmission.order_reference),
      customerEmail: String(insertedSubmission.customer_email),
      customerName: String(insertedSubmission.customer_name),
      contactPhone: String(insertedSubmission.contact_phone),
      paymentStatus: "pending",
      shopierPaymentUrl: storyOfUsDemoCtaConfig.shopierPaymentUrl,
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

function createOrderReference() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `SOU-${datePart}-${createRandomCode(6)}`;
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
