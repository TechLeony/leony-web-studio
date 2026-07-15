import {
  createStoryOfUsEmailTemplate,
  type StoryOfUsFinalSiteReadyTemplateInput,
  type StoryOfUsOrderCreatedTemplateInput,
} from "./storyOfUsEmailTemplates.server";

export type SendStoryOfUsEmailInput =
  | (StoryOfUsOrderCreatedTemplateInput & {
      recipientEmail: string;
      idempotencyKey: string;
    })
  | (StoryOfUsFinalSiteReadyTemplateInput & {
      recipientEmail: string;
      idempotencyKey: string;
    });

export type SendStoryOfUsEmailResult =
  | {
      ok: true;
      providerMessageId: string;
    }
  | {
      ok: false;
      errorCode:
        | "invalid_input"
        | "missing_configuration"
        | "rate_limited"
        | "provider_rejected"
        | "provider_unavailable"
        | "provider_error";
      retryAfterSeconds?: number;
    };

type NormalizedSendStoryOfUsEmailInput =
  | (StoryOfUsOrderCreatedTemplateInput & {
      recipientEmail: string;
      idempotencyKey: string;
    })
  | (StoryOfUsFinalSiteReadyTemplateInput & {
      recipientEmail: string;
      idempotencyKey: string;
    });

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const STORYOFUS_EMAIL_FROM = "StoryOfUs by Leony <storyofus@mail.leony.tech>";
const STORYOFUS_EMAIL_REPLY_TO = "contact@leony.tech";
const DEFAULT_STORYOFUS_PUBLIC_ORIGIN = "https://leony.tech";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 256;
const ORDER_REFERENCE_PATTERN = /^SOU-(\d{8})-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const FINAL_SITE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function sendStoryOfUsEmail(
  input: SendStoryOfUsEmailInput,
): Promise<SendStoryOfUsEmailResult> {
  const config = getStoryOfUsResendConfig();

  if (!config.ok) {
    return {
      ok: false,
      errorCode: "missing_configuration",
    };
  }

  const normalizedInput = normalizeSendStoryOfUsEmailInput(input);

  if (!isValidStoryOfUsEmailInput(normalizedInput, config.publicOrigin)) {
    return {
      ok: false,
      errorCode: "invalid_input",
    };
  }

  const template = createStoryOfUsEmailTemplate(normalizedInput);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": normalizedInput.idempotencyKey,
      },
      body: JSON.stringify({
        from: STORYOFUS_EMAIL_FROM,
        to: [normalizedInput.recipientEmail],
        reply_to: STORYOFUS_EMAIL_REPLY_TO,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
      signal: controller.signal,
    });

    return await mapResendResponse(response);
  } catch {
    return {
      ok: false,
      errorCode: "provider_unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeSendStoryOfUsEmailInput(
  input: SendStoryOfUsEmailInput,
): NormalizedSendStoryOfUsEmailInput {
  const sharedInput = {
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    customerName: input.customerName.trim(),
    orderReference: input.orderReference.trim(),
    idempotencyKey: input.idempotencyKey.trim(),
  };

  if (input.emailType === "order_created") {
    return {
      ...sharedInput,
      emailType: "order_created",
      setupUrl: input.setupUrl.trim(),
      trackOrderUrl: input.trackOrderUrl.trim(),
    };
  }

  return {
    ...sharedInput,
    emailType: "final_site_ready",
    finalSiteUrl: input.finalSiteUrl.trim(),
  };
}

function getStoryOfUsResendConfig():
  | {
      ok: true;
      apiKey: string;
      publicOrigin: URL;
    }
  | {
      ok: false;
    } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const configuredOrigin =
    process.env.STORYOFUS_PUBLIC_ORIGIN?.trim() || DEFAULT_STORYOFUS_PUBLIC_ORIGIN;
  const publicOrigin = parseUrl(configuredOrigin);

  if (!apiKey || !publicOrigin || !isAllowedStoryOfUsPublicOrigin(publicOrigin)) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    apiKey,
    publicOrigin,
  };
}

function isValidStoryOfUsEmailInput(input: NormalizedSendStoryOfUsEmailInput, publicOrigin: URL) {
  if (!isValidEmail(input.recipientEmail)) {
    return false;
  }

  if (!isValidCustomerName(input.customerName)) {
    return false;
  }

  if (!isValidOrderReference(input.orderReference)) {
    return false;
  }

  if (!isValidIdempotencyKey(input.idempotencyKey)) {
    return false;
  }

  if (input.emailType === "order_created") {
    return (
      isValidStoryOfUsSetupUrl(input.setupUrl, publicOrigin) &&
      isValidStoryOfUsTrackOrderUrl(input.trackOrderUrl, publicOrigin)
    );
  }

  return isValidStoryOfUsFinalSiteUrl(input.finalSiteUrl, publicOrigin);
}

function isValidStoryOfUsSetupUrl(value: string, publicOrigin: URL) {
  const url = parseUrl(value);

  if (!url || !hasExactConfiguredOrigin(url, publicOrigin)) {
    return false;
  }

  if (url.pathname !== "/storyofus/setup") {
    return false;
  }

  const token = url.searchParams.get("token");

  return token !== null && token.trim().length > 0;
}

function isValidStoryOfUsTrackOrderUrl(value: string, publicOrigin: URL) {
  const url = parseUrl(value);

  if (!url || !hasExactConfiguredOrigin(url, publicOrigin)) {
    return false;
  }

  if (url.pathname !== "/storyofus/track-order") {
    return false;
  }

  const code = url.searchParams.get("code");

  return code === null || code.trim().length > 0;
}

function isValidStoryOfUsFinalSiteUrl(value: string, publicOrigin: URL) {
  const url = parseUrl(value);

  if (!url || !hasExactConfiguredOrigin(url, publicOrigin)) {
    return false;
  }

  if (/%2f/i.test(url.pathname)) {
    return false;
  }

  if (url.search) {
    return false;
  }

  const pathParts = url.pathname.split("/");
  const slug = pathParts[3];

  return (
    pathParts.length === 4 &&
    pathParts[0] === "" &&
    pathParts[1] === "storyofus" &&
    pathParts[2] === "site" &&
    typeof slug === "string" &&
    FINAL_SITE_SLUG_PATTERN.test(slug)
  );
}

function hasExactConfiguredOrigin(url: URL, publicOrigin: URL) {
  return url.origin === publicOrigin.origin;
}

function isAllowedStoryOfUsPublicOrigin(url: URL) {
  if (process.env.NODE_ENV === "production") {
    return url.origin === DEFAULT_STORYOFUS_PUBLIC_ORIGIN;
  }

  if (url.origin === DEFAULT_STORYOFUS_PUBLIC_ORIGIN) {
    return true;
  }

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  return isLocalhost && (url.protocol === "http:" || url.protocol === "https:");
}

function isValidIdempotencyKey(value: string) {
  const trimmedValue = value.trim();

  return (
    trimmedValue.length > 0 &&
    trimmedValue.length <= MAX_IDEMPOTENCY_KEY_LENGTH &&
    !hasAsciiControlCharacter(trimmedValue) &&
    !/\s/.test(trimmedValue) &&
    /^[a-zA-Z0-9:._-]+$/.test(trimmedValue)
  );
}

async function mapResendResponse(response: Response): Promise<SendStoryOfUsEmailResult> {
  if (response.ok) {
    const providerMessageId = await getProviderMessageId(response);

    if (providerMessageId) {
      return {
        ok: true,
        providerMessageId,
      };
    }

    return {
      ok: false,
      errorCode: "provider_error",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      errorCode: "rate_limited",
      retryAfterSeconds: parseRetryAfterSeconds(response.headers.get("Retry-After")),
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      errorCode: "missing_configuration",
    };
  }

  if (response.status === 408) {
    return {
      ok: false,
      errorCode: "provider_unavailable",
    };
  }

  if (response.status >= 500) {
    return {
      ok: false,
      errorCode: "provider_unavailable",
    };
  }

  if (response.status >= 400 && response.status < 500) {
    return {
      ok: false,
      errorCode: "provider_rejected",
    };
  }

  return {
    ok: false,
    errorCode: "provider_error",
  };
}

async function getProviderMessageId(response: Response) {
  try {
    const parsed = (await response.json()) as { id?: unknown };

    return typeof parsed.id === "string" && parsed.id.trim() ? parsed.id : null;
  } catch {
    return null;
  }
}

function parseRetryAfterSeconds(value: string | null) {
  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return Math.ceil(numericValue);
  }

  const retryDate = Date.parse(value);

  if (!Number.isFinite(retryDate)) {
    return undefined;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isValidCustomerName(value: string) {
  return value.length > 0 && value.length <= 160 && !hasAsciiControlCharacter(value);
}

function isValidOrderReference(value: string) {
  if (value.length === 0 || value.length > 80 || hasAsciiControlCharacter(value)) {
    return false;
  }

  const match = value.match(ORDER_REFERENCE_PATTERN);

  if (!match) {
    return false;
  }

  const datePart = match[1];
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6));
  const day = Number(datePart.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
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
