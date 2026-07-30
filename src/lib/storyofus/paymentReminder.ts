export type StoryOfUsPaymentReminderCandidate = {
  id?: unknown;
  created_at?: unknown;
  customer_email?: unknown;
  payment_status?: unknown;
  status?: unknown;
  refund_status?: unknown;
  checkout_expires_at?: unknown;
  shopier_payment_url?: unknown;
};

export const STORYOFUS_PAYMENT_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isEligibleForStoryOfUsPaymentReminderQueue(
  candidate: StoryOfUsPaymentReminderCandidate,
  now = new Date(),
) {
  if (!isValidDate(now)) {
    return false;
  }

  const createdAt = parseTimestamp(candidate.created_at);
  const checkoutExpiresAt = parseTimestamp(candidate.checkout_expires_at);

  return (
    isUuid(stringValue(candidate.id)) &&
    createdAt !== null &&
    checkoutExpiresAt !== null &&
    createdAt <= now.getTime() - STORYOFUS_PAYMENT_REMINDER_DELAY_MS &&
    checkoutExpiresAt > now.getTime() &&
    stringValue(candidate.payment_status) === "pending" &&
    stringValue(candidate.status) === "draft" &&
    ["none", "rejected"].includes(stringValue(candidate.refund_status) || "none") &&
    isValidEmail(stringValue(candidate.customer_email)) &&
    isValidShopierPaymentUrl(stringValue(candidate.shopier_payment_url))
  );
}

function parseTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isValidDate(value: Date) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim().toLowerCase());
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim().toLowerCase());
}

function isValidShopierPaymentUrl(value: string) {
  try {
    const url = new URL(value.trim());

    return (
      url.protocol === "https:" &&
      (url.hostname === "www.shopier.com" || url.hostname === "shopier.com")
    );
  } catch {
    return false;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
