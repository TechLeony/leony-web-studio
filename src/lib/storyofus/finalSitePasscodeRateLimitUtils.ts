export type StoryOfUsFinalSitePasscodeRateLimitErrorCode =
  | "passcode_rate_limited"
  | "passcode_rate_limit_unavailable"
  | "passcode_rate_limit_configuration_missing"
  | "passcode_rate_limit_invalid_response";

export class StoryOfUsFinalSitePasscodeRateLimitError extends Error {
  readonly errorCode: StoryOfUsFinalSitePasscodeRateLimitErrorCode;
  readonly retryAfterSeconds: number;

  constructor(errorCode: StoryOfUsFinalSitePasscodeRateLimitErrorCode, retryAfterSeconds = 0) {
    super("StoryOfUs final-site passcode rate limit failed.");
    this.errorCode = errorCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function parseFinalSitePasscodeRateLimitRpcRow(data: unknown) {
  if (Array.isArray(data) && data.length !== 1) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_invalid_response");
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!isRecord(row) || !hasOwn(row, "limited") || !hasOwn(row, "retry_after_seconds")) {
    throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_invalid_response");
  }

  const limited = row.limited;
  const retryAfterSeconds = numberValue(row.retry_after_seconds);

  if (limited === false && retryAfterSeconds === 0) {
    return {
      limited,
      retryAfterSeconds,
    };
  }

  if (
    limited === true &&
    retryAfterSeconds !== null &&
    Number.isInteger(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return {
      limited,
      retryAfterSeconds,
    };
  }

  throw new StoryOfUsFinalSitePasscodeRateLimitError("passcode_rate_limit_invalid_response");
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
