import { createHmac } from "node:crypto";

import { getRequest } from "@tanstack/react-start/server";

import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type StoryOfUsCheckoutRateLimitErrorCode =
  | "checkout_rate_limited"
  | "checkout_rate_limit_unavailable"
  | "checkout_rate_limit_configuration_missing"
  | "checkout_rate_limit_invalid_response";

export class StoryOfUsCheckoutRateLimitError extends Error {
  constructor(
    public readonly errorCode: StoryOfUsCheckoutRateLimitErrorCode,
    public readonly retryAfterSeconds = 0,
  ) {
    super("StoryOfUs checkout rate limit failed.");
  }
}

type CheckoutRateLimitRpcRow = {
  limited?: unknown;
  limited_scope?: unknown;
  retry_after_seconds?: unknown;
};

const RATE_LIMIT_SECRET_MIN_LENGTH = 32;
const SOURCE_MAX_LENGTH = 160;

export async function consumeStoryOfUsCheckoutRateLimit(customerEmail: string) {
  const secret = process.env.STORYOFUS_CHECKOUT_RATE_LIMIT_SECRET?.trim() ?? "";

  if (secret.length < RATE_LIMIT_SECRET_MIN_LENGTH) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_configuration_missing");
  }

  const request = getCheckoutRequest();
  const source = getNormalizedRequestSource(request.headers);
  const email = customerEmail.trim().toLowerCase();

  const { data, error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_consume_checkout_rate_limit",
    {
      p_global_key_hash: createRateLimitHash(secret, "global:storyofus-checkout-v1"),
      p_source_key_hash: createRateLimitHash(secret, `source:${source}`),
      p_email_key_hash: createRateLimitHash(secret, `email:${email}`),
    },
  );

  if (error) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_unavailable");
  }

  const row = parseRateLimitRpcRow(data);

  if (row.limited) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limited", row.retryAfterSeconds);
  }
}

function getCheckoutRequest() {
  try {
    const request = getRequest();

    if (!request?.headers) {
      throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_unavailable");
    }

    return request;
  } catch (error) {
    if (error instanceof StoryOfUsCheckoutRateLimitError) {
      throw error;
    }

    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_unavailable");
  }
}

function getNormalizedRequestSource(headers: Headers) {
  const rawSource =
    firstHeaderValue(headers.get("x-vercel-forwarded-for")) ||
    firstHeaderValue(headers.get("cf-connecting-ip")) ||
    firstHeaderValue(headers.get("x-real-ip")) ||
    firstHeaderValue(headers.get("x-forwarded-for")) ||
    "unknown";

  return rawSource.trim().toLowerCase().slice(0, SOURCE_MAX_LENGTH) || "unknown";
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function createRateLimitHash(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function parseRateLimitRpcRow(data: unknown) {
  if (Array.isArray(data) && data.length !== 1) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_invalid_response");
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!isRecord(row)) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_invalid_response");
  }

  if (
    !hasOwn(row, "limited") ||
    !hasOwn(row, "limited_scope") ||
    !hasOwn(row, "retry_after_seconds")
  ) {
    throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_invalid_response");
  }

  const limited = row.limited;
  const retryAfterSeconds = numberValue(row.retry_after_seconds);

  if (limited === false && row.limited_scope === null && retryAfterSeconds === 0) {
    return {
      limited,
      retryAfterSeconds,
    };
  }

  if (
    limited === true &&
    typeof row.limited_scope === "string" &&
    ["global", "source", "email"].includes(row.limited_scope) &&
    retryAfterSeconds !== null &&
    Number.isInteger(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return {
      limited,
      retryAfterSeconds,
    };
  }

  throw new StoryOfUsCheckoutRateLimitError("checkout_rate_limit_invalid_response");
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
