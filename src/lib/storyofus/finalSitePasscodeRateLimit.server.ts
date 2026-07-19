import { createHmac } from "node:crypto";

import { getRequest } from "@tanstack/react-start/server";

import { normalizeStoryOfUsFinalSiteSlug } from "./finalSiteUtils";
import {
  StoryOfUsFinalSitePasscodeRateLimitError,
  parseFinalSitePasscodeRateLimitRpcRow,
} from "./finalSitePasscodeRateLimitUtils";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

const RATE_LIMIT_SECRET_MIN_LENGTH = 32;
const SOURCE_MAX_LENGTH = 160;
const UNKNOWN_SOURCE = "unknown";

export async function assertStoryOfUsFinalSitePasscodeAttemptAllowed(siteSlug: string) {
  const bucketKeyHash = createFinalSitePasscodeBucketKeyHash(siteSlug);
  const { data, error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_check_final_site_passcode_rate_limit",
    {
      p_bucket_key_hash: bucketKeyHash,
    },
  );

  if (error) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_unavailable");
  }

  const row = parseFinalSitePasscodeRateLimitRpcRow(data);

  if (row.limited) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError(
      "passcode_rate_limited",
      row.retryAfterSeconds,
    );
  }

  return bucketKeyHash;
}

export async function recordStoryOfUsFinalSitePasscodeFailure(bucketKeyHash: string) {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_record_final_site_passcode_failure",
    {
      p_bucket_key_hash: bucketKeyHash,
    },
  );

  if (error) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_unavailable");
  }

  return parseFinalSitePasscodeRateLimitRpcRow(data);
}

export async function clearStoryOfUsFinalSitePasscodeFailures(bucketKeyHash: string) {
  const { error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_clear_final_site_passcode_rate_limit",
    {
      p_bucket_key_hash: bucketKeyHash,
    },
  );

  if (error) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_unavailable");
  }
}

export function createFinalSitePasscodeBucketKeyHash(siteSlug: string) {
  const secret = getFinalSitePasscodeRateLimitSecret();
  const request = getFinalSitePasscodeRequest();
  const source = getNormalizedRequestSource(request.headers);
  const slug = normalizeStoryOfUsFinalSiteSlug(siteSlug) ?? "invalid";

  return createRateLimitHash(secret, `final-site-passcode:v1:source:${source}:slug:${slug}`);
}

function getFinalSitePasscodeRateLimitSecret() {
  const secret =
    process.env.STORYOFUS_PASSCODE_RATE_LIMIT_SECRET?.trim() ||
    process.env.STORYOFUS_CHECKOUT_RATE_LIMIT_SECRET?.trim() ||
    "";

  if (secret.length < RATE_LIMIT_SECRET_MIN_LENGTH) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_configuration_missing");
  }

  return secret;
}

function getFinalSitePasscodeRequest() {
  try {
    const request = getRequest();

    if (!request?.headers) {
      throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_unavailable");
    }

    return request;
  } catch (error) {
    if (error instanceof StoryOfUsFinalSitePasscodeRateLimitError) {
      throw error;
    }

    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_unavailable");
  }
}

function getNormalizedRequestSource(headers: Headers) {
  const rawSource =
    firstHeaderValue(headers.get("x-vercel-forwarded-for")) ||
    firstHeaderValue(headers.get("cf-connecting-ip")) ||
    firstHeaderValue(headers.get("x-real-ip")) ||
    firstHeaderValue(headers.get("x-forwarded-for")) ||
    UNKNOWN_SOURCE;

  return rawSource.trim().toLowerCase().slice(0, SOURCE_MAX_LENGTH) || UNKNOWN_SOURCE;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function createRateLimitHash(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
