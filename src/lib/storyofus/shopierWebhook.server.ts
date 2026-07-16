import { createHmac, timingSafeEqual } from "node:crypto";

import { storyOfUsShopierConfig } from "./shopierConfig.server";

export type StoryOfUsShopierWebhookErrorCode =
  | "shopier_webhook_configuration_missing"
  | "shopier_webhook_invalid_content_type"
  | "shopier_webhook_invalid_request"
  | "shopier_webhook_body_too_large"
  | "shopier_webhook_invalid_json"
  | "shopier_webhook_missing_signature"
  | "shopier_webhook_invalid_signature"
  | "shopier_webhook_missing_event"
  | "shopier_webhook_unsupported_event"
  | "shopier_webhook_missing_event_id"
  | "shopier_webhook_invalid_headers"
  | "shopier_webhook_invalid_payload"
  | "shopier_webhook_unpaid_order";

export class StoryOfUsShopierWebhookError extends Error {
  constructor(public readonly errorCode: StoryOfUsShopierWebhookErrorCode) {
    super("StoryOfUs Shopier webhook could not be verified.");
  }
}

export type NormalizedStoryOfUsShopierOrderWebhook = {
  eventId: string;
  eventType: "order.created";
  orderId: string;
  paymentStatus: "paid";
  amount: number;
  currency: string;
  lineItems: Array<{
    productId: string;
    quantity: number;
  }>;
  providerCreatedAt: string | null;
  sanitizedPayload: StoryOfUsShopierPaymentAuditPayload;
};

export type StoryOfUsShopierPaymentAuditPayload = {
  provider: "shopier";
  eventType: "order.created";
  eventId: string;
  orderId: string;
  paymentStatus: "paid";
  amount: number;
  currency: string;
  lineItems: Array<{
    productId: string;
    quantity: number;
  }>;
  providerCreatedAt: string | null;
};

const SHOPIER_WEBHOOK_BODY_MAX_BYTES = 256 * 1024;
const SHOPIER_WEBHOOK_SECRET_MAX_LENGTH = 512;
const SHOPIER_WEBHOOK_HEADER_MAX_LENGTH = 256;
const SHOPIER_WEBHOOK_ID_MAX_LENGTH = 160;
const SHOPIER_ORDER_ID_MAX_LENGTH = 160;
const SHOPIER_PRODUCT_ID_MAX_LENGTH = 160;
const SHOPIER_LINE_ITEM_MAX_COUNT = 20;
const SHOPIER_AMOUNT_MAX_LENGTH = 32;
const SANITIZED_PAYLOAD_MAX_BYTES = 4096;
const SHOPIER_SUPPORTED_CURRENCIES = new Set(["TRY", "USD", "EUR"]);
const SHOPIER_SIGNATURE_PATTERN = /^[0-9a-f]{64}$/;

export async function parseVerifiedStoryOfUsShopierWebhook(
  request: Request,
): Promise<NormalizedStoryOfUsShopierOrderWebhook> {
  assertNoQueryParameters(request.url);
  assertJsonContentType(request.headers);

  const parsedPayload = parseJsonBody(await readBoundedUtf8Body(request));
  const signatureMessage = stringifyForShopierSignature(parsedPayload);
  const signature = requiredSignatureHeader(request.headers);

  verifyShopierSignature({
    signatureMessage,
    signature,
  });

  const headers = parseShopierWebhookHeaders(request.headers);

  if (headers.eventType !== "order.created") {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_unsupported_event");
  }

  return parseVerifiedOrderPayload(parsedPayload, headers);
}

function assertNoQueryParameters(url: string) {
  if (new URL(url).search) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_request");
  }
}

function assertJsonContentType(headers: Headers) {
  const contentType = headers.get("content-type") ?? "";
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();

  if (mediaType !== "application/json") {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_content_type");
  }
}

async function readBoundedUtf8Body(request: Request) {
  const declaredLength = request.headers.get("content-length");

  if (declaredLength) {
    const parsedLength = Number(declaredLength);

    if (
      !Number.isInteger(parsedLength) ||
      parsedLength <= 0 ||
      parsedLength > SHOPIER_WEBHOOK_BODY_MAX_BYTES
    ) {
      throw new StoryOfUsShopierWebhookError("shopier_webhook_body_too_large");
    }
  }

  if (!request.body) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalLength += value.byteLength;

    if (totalLength > SHOPIER_WEBHOOK_BODY_MAX_BYTES) {
      throw new StoryOfUsShopierWebhookError("shopier_webhook_body_too_large");
    }

    chunks.push(value);
  }

  if (totalLength === 0) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }

  const body = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }
}

function stringifyForShopierSignature(parsedPayload: unknown) {
  let signatureMessage: string | undefined;

  try {
    signatureMessage = JSON.stringify(parsedPayload);
  } catch {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }

  if (typeof signatureMessage !== "string") {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }

  return signatureMessage;
}

function parseJsonBody(body: string) {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_json");
  }
}

function parseShopierWebhookHeaders(headers: Headers) {
  const eventType = requiredSingleHeader(headers, "Shopier-Event", "shopier_webhook_missing_event");
  const eventId = requiredSingleHeader(
    headers,
    "Shopier-Webhook-Id",
    "shopier_webhook_missing_event_id",
  );
  const timestamp = requiredSingleHeader(
    headers,
    "Shopier-Timestamp",
    "shopier_webhook_invalid_headers",
  );

  if (
    !isBoundedCleanText(eventType, SHOPIER_WEBHOOK_HEADER_MAX_LENGTH) ||
    !isBoundedCleanText(eventId, SHOPIER_WEBHOOK_ID_MAX_LENGTH) ||
    !/^\d{1,20}$/.test(timestamp)
  ) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_headers");
  }

  return {
    eventType,
    eventId,
  };
}

function requiredSingleHeader(
  headers: Headers,
  name: string,
  missingCode: StoryOfUsShopierWebhookErrorCode,
) {
  const value = optionalSingleHeader(headers, name);

  if (!value) {
    throw new StoryOfUsShopierWebhookError(missingCode);
  }

  return value;
}

function requiredSignatureHeader(headers: Headers) {
  const value = headers.get("Shopier-Signature");

  if (value === null) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_missing_signature");
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.includes(",") ||
    normalized.length > SHOPIER_WEBHOOK_HEADER_MAX_LENGTH ||
    hasAsciiControlCharacter(normalized)
  ) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_signature");
  }

  return normalized;
}

function optionalSingleHeader(headers: Headers, name: string) {
  const value = headers.get(name);

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.includes(",") ||
    normalized.length > SHOPIER_WEBHOOK_HEADER_MAX_LENGTH ||
    hasAsciiControlCharacter(normalized)
  ) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_headers");
  }

  return normalized;
}

function verifyShopierSignature({
  signatureMessage,
  signature,
}: {
  signatureMessage: string;
  signature: string;
}) {
  const webhookSecret = storyOfUsShopierConfig.webhookSecret;

  if (!webhookSecret || webhookSecret.length > SHOPIER_WEBHOOK_SECRET_MAX_LENGTH) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_configuration_missing");
  }

  if (!SHOPIER_SIGNATURE_PATTERN.test(signature)) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_signature");
  }

  const suppliedDigest = Buffer.from(signature, "hex");
  const expectedDigest = createHmac("sha256", webhookSecret)
    .update(signatureMessage, "utf8")
    .digest();

  if (
    suppliedDigest.byteLength !== expectedDigest.byteLength ||
    !timingSafeEqual(suppliedDigest, expectedDigest)
  ) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_signature");
  }
}

function parseVerifiedOrderPayload(
  payload: unknown,
  headers: {
    eventId: string;
    eventType: string;
  },
): NormalizedStoryOfUsShopierOrderWebhook {
  if (!isRecord(payload)) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  const orderId = normalizeRequiredText(payload.id, SHOPIER_ORDER_ID_MAX_LENGTH);
  const paymentStatus = normalizeRequiredText(payload.paymentStatus, 32);

  if (!orderId || !paymentStatus) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  if (paymentStatus !== "paid") {
    if (paymentStatus === "unpaid") {
      throw new StoryOfUsShopierWebhookError("shopier_webhook_unpaid_order");
    }

    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  const currency = normalizeRequiredText(payload.currency, 3)?.toUpperCase() ?? "";
  const amount = parseOfficialAmount(isRecord(payload.totals) ? payload.totals.total : undefined);
  const providerCreatedAt = normalizeProviderCreatedAt(payload.dateCreated);
  const lineItems = parseLineItems(payload.lineItems);

  if (!SHOPIER_SUPPORTED_CURRENCIES.has(currency) || amount === null) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  if (lineItems.length !== 1 || lineItems[0]?.quantity !== 1) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  const sanitizedPayload = createSanitizedPayload({
    eventId: headers.eventId,
    eventType: "order.created",
    orderId,
    paymentStatus,
    amount,
    currency,
    lineItems,
    providerCreatedAt,
  });

  return {
    eventId: sanitizedPayload.eventId,
    eventType: sanitizedPayload.eventType,
    orderId: sanitizedPayload.orderId,
    paymentStatus: sanitizedPayload.paymentStatus,
    amount: sanitizedPayload.amount,
    currency: sanitizedPayload.currency,
    lineItems: sanitizedPayload.lineItems,
    providerCreatedAt: sanitizedPayload.providerCreatedAt,
    sanitizedPayload,
  };
}

function parseLineItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > SHOPIER_LINE_ITEM_MAX_COUNT) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
    }

    const productId = normalizeRequiredText(item.productId, SHOPIER_PRODUCT_ID_MAX_LENGTH);
    const quantity = item.quantity;

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
    }

    return {
      productId,
      quantity,
    };
  });
}

function parseOfficialAmount(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (
    normalized.length === 0 ||
    normalized.length > SHOPIER_AMOUNT_MAX_LENGTH ||
    !/^\d+(?:\.\d+)?$/.test(normalized)
  ) {
    return null;
  }

  const amount = Number(normalized);

  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeProviderCreatedAt(value: unknown) {
  const dateCreated = normalizeRequiredText(value, 40);

  if (!dateCreated || Number.isNaN(Date.parse(dateCreated))) {
    return null;
  }

  return dateCreated;
}

function createSanitizedPayload(input: StoryOfUsShopierPaymentAuditPayload) {
  const serialized = JSON.stringify(input);

  if (new TextEncoder().encode(serialized).byteLength > SANITIZED_PAYLOAD_MAX_BYTES) {
    throw new StoryOfUsShopierWebhookError("shopier_webhook_invalid_payload");
  }

  return input;
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!isBoundedCleanText(normalized, maxLength)) {
    return null;
  }

  return normalized;
}

function isBoundedCleanText(value: string, maxLength: number) {
  return Boolean(value) && value.length <= maxLength && !hasAsciiControlCharacter(value);
}

function hasAsciiControlCharacter(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (typeof codePoint === "number" && (codePoint <= 0x1f || codePoint === 0x7f)) {
      return true;
    }
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
