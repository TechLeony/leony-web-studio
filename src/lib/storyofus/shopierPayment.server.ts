import { storyOfUsShopierConfig } from "./shopierConfig.server";

export type StoryOfUsShopierPaymentOrder = {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  contactPhone: string;
  amount: number;
  currency: string;
};

export type StoryOfUsShopierPaymentTarget = {
  paymentUrl: string;
  orderReference: string;
  amount: number;
  currency: string;
  needsManualShopierConfig: boolean;
};

export type NormalizedShopierCallbackPayload = {
  orderReference: string;
  paymentReference: string | null;
  status: "success" | "failed" | "cancelled" | "pending" | "unknown";
  amount: number | null;
  currency: string | null;
  raw: Record<string, unknown>;
};

export function createShopierPaymentTarget(
  order: StoryOfUsShopierPaymentOrder,
): StoryOfUsShopierPaymentTarget {
  // TODO: Confirm Shopier's exact merchant order id / platform_order_id payment
  // creation field from the merchant integration docs. When available, pass
  // order.orderReference as that value together with callback/success/fail URLs.
  return {
    paymentUrl: storyOfUsShopierConfig.fallbackPaymentUrl,
    orderReference: order.orderReference,
    amount: order.amount,
    currency: order.currency,
    needsManualShopierConfig: true,
  };
}

export function parseShopierCallbackPayload(
  raw: Record<string, unknown>,
): NormalizedShopierCallbackPayload {
  // TODO: Confirm exact Shopier callback field names from merchant docs/panel.
  // Candidate merchant order id fields below are intentionally centralized here.
  const orderReference = stringField(
    raw.platform_order_id ??
      raw.merchant_order_id ??
      raw.order_reference ??
      raw.orderReference ??
      raw.order_id,
  );
  const paymentReference =
    stringField(raw.payment_id ?? raw.transaction_id ?? raw.shopier_order_id ?? raw.id) || null;
  const rawStatus = stringField(raw.status ?? raw.payment_status ?? raw.transaction_status);
  const amount = numberField(raw.amount ?? raw.payment_amount ?? raw.total_amount);
  const currency = stringField(raw.currency ?? raw.payment_currency).toUpperCase() || null;

  return {
    orderReference,
    paymentReference,
    status: normalizeShopierStatus(rawStatus),
    amount,
    currency,
    raw,
  };
}

export async function verifyShopierCallback(
  _rawBody: string,
  _headers: Headers,
): Promise<boolean> {
  if (storyOfUsShopierConfig.allowUnverifiedCallbackDev) {
    return true;
  }

  // TODO: Confirm Shopier signature/hash verification formula from merchant
  // integration docs before production. Until then, production stays locked down.
  return false;
}

function normalizeShopierStatus(value: string): NormalizedShopierCallbackPayload["status"] {
  const normalized = value.trim().toLowerCase();

  if (["success", "successful", "paid", "completed", "approved"].includes(normalized)) {
    return "success";
  }

  if (["failed", "fail", "declined", "error"].includes(normalized)) {
    return "failed";
  }

  if (["cancelled", "canceled", "cancel"].includes(normalized)) {
    return "cancelled";
  }

  if (["pending", "waiting"].includes(normalized)) {
    return "pending";
  }

  return "unknown";
}

function stringField(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function numberField(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
