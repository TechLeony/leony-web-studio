import { createServerFn } from "@tanstack/react-start";

import {
  type StoryOfUsCheckoutContactInput,
  validateStoryOfUsCheckoutContact,
} from "./contactValidation";
import {
  consumeStoryOfUsCheckoutRateLimit,
  StoryOfUsCheckoutRateLimitError,
} from "./checkoutRateLimit.server";
import {
  createStoryOfUsShopierProduct,
  StoryOfUsShopierProductError,
  type StoryOfUsShopierProductErrorCode,
} from "./shopierApi.server";
import {
  assertStoryOfUsShopierProductConfiguration,
  storyOfUsShopierConfig,
} from "./shopierConfig.server";
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
};

const ORDER_REFERENCE_MAX_ATTEMPTS = 8;
const TRACKING_CODE_MAX_ATTEMPTS = 8;
const GENERIC_PAYMENT_PREPARATION_ERROR =
  "Ödeme adımı şu anda hazırlanamadı. Lütfen biraz sonra tekrar deneyin.";
const RATE_LIMITED_CHECKOUT_ERROR =
  "Çok fazla ödeme denemesi yapıldı. Lütfen biraz sonra tekrar deneyin.";

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
      throw new Error(
        Object.values(validation.errors)[0] ?? "Lütfen iletişim bilgilerini kontrol edin.",
      );
    }

    const paymentAmount = storyOfUsShopierConfig.paymentAmountTry;
    const paymentCurrency = storyOfUsShopierConfig.paymentCurrency;

    if (!isValidPaymentSettings(paymentAmount, paymentCurrency)) {
      throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
    }

    assertCheckoutPaymentConfiguration();
    await consumeCheckoutRateLimit(validation.normalized.customerEmail);

    const orderReference = await createUniqueOrderReference();
    const trackingCode = await createUniqueTrackingCode();
    const acceptedAt = new Date().toISOString();
    const checkoutExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
        "id, order_reference, tracking_code, customer_email, customer_name, contact_phone, payment_amount, payment_currency",
      )
      .single();

    if (error || !insertedSubmission) {
      throw new Error(`StoryOfUs checkout order could not be created: ${error?.message}`);
    }

    const submissionId = String(insertedSubmission.id);
    const normalizedPaymentAmount = Number(insertedSubmission.payment_amount) || paymentAmount;
    const normalizedPaymentCurrency = String(
      insertedSubmission.payment_currency || paymentCurrency,
    );
    const shopierProduct = await createAndPersistShopierProduct({
      submissionId,
      orderReference,
      amount: normalizedPaymentAmount,
      currency: normalizedPaymentCurrency,
    });

    return {
      orderReference: String(insertedSubmission.order_reference),
      trackingCode: String(insertedSubmission.tracking_code),
      customerEmail: String(insertedSubmission.customer_email),
      customerName: String(insertedSubmission.customer_name),
      contactPhone: String(insertedSubmission.contact_phone),
      paymentAmount: normalizedPaymentAmount,
      paymentCurrency: normalizedPaymentCurrency,
      shopierPaymentUrl: shopierProduct.paymentUrl,
    };
  });

async function createAndPersistShopierProduct({
  submissionId,
  orderReference,
  amount,
  currency,
}: {
  submissionId: string;
  orderReference: string;
  amount: number;
  currency: string;
}) {
  let product: Awaited<ReturnType<typeof createStoryOfUsShopierProduct>>;

  try {
    product = await createStoryOfUsShopierProduct({
      orderReference,
      amount,
      currency,
    });
  } catch (error) {
    if (error instanceof StoryOfUsShopierProductError) {
      await saveShopierProductErrorWithRetry(
        submissionId,
        error.errorCode,
        "shopier_product_error_persist_failed",
      );
      throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
    }

    throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
  }

  const mappingSaved = await updateShopierProductFieldsWithRetry(submissionId, {
    shopier_product_id: product.productId,
    shopier_payment_url: product.paymentUrl,
    shopier_product_created_at: new Date().toISOString(),
    shopier_product_error: null,
  });

  if (!mappingSaved) {
    await saveShopierProductErrorWithRetry(
      submissionId,
      "shopier_product_mapping_failed",
      "shopier_product_mapping_error_persist_failed",
    );
    throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
  }

  return product;
}

async function updateShopierProductFieldsWithRetry(
  submissionId: string,
  fields: {
    shopier_product_id: string;
    shopier_payment_url: string;
    shopier_product_created_at: string;
    shopier_product_error: null;
  },
) {
  const firstAttempt = await updateShopierProductFields(submissionId, fields);

  if (firstAttempt) {
    return true;
  }

  return updateShopierProductFields(submissionId, fields);
}

async function updateShopierProductFields(
  submissionId: string,
  fields: {
    shopier_product_id: string;
    shopier_payment_url: string;
    shopier_product_created_at: string;
    shopier_product_error: null;
  },
) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .update(fields)
    .eq("id", submissionId)
    .select("id")
    .maybeSingle();

  return !error && Boolean(data) && String(data.id) === submissionId;
}

async function saveShopierProductError(
  submissionId: string,
  errorCode: StoryOfUsCheckoutProductErrorCode,
) {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .update({
      shopier_product_error: errorCode,
    })
    .eq("id", submissionId)
    .select("id")
    .maybeSingle();

  return !error && Boolean(data) && String(data.id) === submissionId;
}

async function saveShopierProductErrorWithRetry(
  submissionId: string,
  errorCode: StoryOfUsCheckoutProductErrorCode,
  diagnosticCode:
    "shopier_product_error_persist_failed" | "shopier_product_mapping_error_persist_failed",
) {
  const firstAttempt = await saveShopierProductError(submissionId, errorCode);

  if (firstAttempt) {
    return true;
  }

  const secondAttempt = await saveShopierProductError(submissionId, errorCode);

  if (!secondAttempt) {
    console.warn("[StoryOfUs checkout]", {
      eventCode: diagnosticCode,
      submissionId,
    });
  }

  return secondAttempt;
}

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

function isValidPaymentSettings(amount: number, currency: string) {
  return Number.isFinite(amount) && amount > 0 && ["TRY", "USD", "EUR"].includes(currency);
}

function assertCheckoutPaymentConfiguration() {
  try {
    assertStoryOfUsShopierProductConfiguration();
  } catch {
    throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
  }
}

async function consumeCheckoutRateLimit(customerEmail: string) {
  try {
    await consumeStoryOfUsCheckoutRateLimit(customerEmail);
  } catch (error) {
    if (
      error instanceof StoryOfUsCheckoutRateLimitError &&
      error.errorCode === "checkout_rate_limited"
    ) {
      throw new Error(RATE_LIMITED_CHECKOUT_ERROR);
    }

    throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);
  }
}

type StoryOfUsCheckoutProductErrorCode =
  StoryOfUsShopierProductErrorCode | "shopier_product_mapping_failed";
