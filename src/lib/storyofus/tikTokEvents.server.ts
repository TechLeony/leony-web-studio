import { createHash } from "node:crypto";

const TIKTOK_EVENTS_ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const DEFAULT_TIKTOK_PIXEL_ID = "BU35TSQHT2A1QT375GMG";
const DEFAULT_STORYOFUS_PAGE_URL = "https://leony.tech/storyofus";
const STORYOFUS_CONTENT_ID = "storyofus";
const STORYOFUS_CONTENT_NAME = "StoryOfUs Kişiselleştirilmiş Web Sitesi";
const STORYOFUS_EVENT_DESCRIPTION = "StoryOfUs personalized digital gift website";
const TIKTOK_REQUEST_TIMEOUT_MS = 9000;

export type TikTokCompletePaymentInput = {
  submissionId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  pageUrl?: string | null;
  eventTime?: Date | string | number | null;
  ttclid?: string | null;
  ttp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type TikTokCompletePaymentSendResult =
  | { ok: true; skipped: false }
  | { ok: true; skipped: true; reason: "missing_access_token" }
  | { ok: false; skipped: false; reason: "invalid_input" | "api_error" | "network_error" };

type FetchLike = typeof fetch;

type TikTokEventUser = {
  email?: string;
  external_id?: string;
  ttclid?: string;
  ttp?: string;
  ip?: string;
  user_agent?: string;
};

type TikTokCompletePaymentPayload = {
  event_source: "web";
  event_source_id: string;
  data: [
    {
      event: "CompletePayment";
      event_time: number;
      event_id: string;
      user: TikTokEventUser;
      properties: {
        currency: "TRY";
        value: number;
        content_type: "product";
        contents: [
          {
            content_id: typeof STORYOFUS_CONTENT_ID;
            content_name: typeof STORYOFUS_CONTENT_NAME;
            quantity: 1;
            price: number;
          },
        ];
        description: typeof STORYOFUS_EVENT_DESCRIPTION;
      };
      page: {
        url: string;
      };
    },
  ];
};

export async function sendTikTokCompletePayment(
  input: TikTokCompletePaymentInput,
  options: {
    accessToken?: string;
    pixelId?: string;
    fetchFn?: FetchLike;
  } = {},
): Promise<TikTokCompletePaymentSendResult> {
  const accessToken = options.accessToken ?? process.env.TIKTOK_EVENTS_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    return { ok: true, skipped: true, reason: "missing_access_token" };
  }

  const payload = createTikTokCompletePaymentPayload(input, {
    pixelId: options.pixelId ?? process.env.TIKTOK_PIXEL_ID,
  });

  if (!payload) {
    return { ok: false, skipped: false, reason: "invalid_input" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIKTOK_REQUEST_TIMEOUT_MS);

  try {
    const response = await (options.fetchFn ?? fetch)(TIKTOK_EVENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const responseBody = await parseTikTokResponseBody(response);

    if (!isTikTokSuccessResponse(responseBody)) {
      return { ok: false, skipped: false, reason: "api_error" };
    }

    return { ok: true, skipped: false };
  } catch {
    return { ok: false, skipped: false, reason: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}

export function createTikTokCompletePaymentPayload(
  input: TikTokCompletePaymentInput,
  options: {
    pixelId?: string | null;
  } = {},
): TikTokCompletePaymentPayload | null {
  const emailHash = hashNormalizedValue(input.customerEmail);
  const externalIdHash = hashNormalizedValue(input.submissionId);
  const amount = normalizeAmount(input.amount);
  const currency = input.currency.trim().toUpperCase();
  const eventTime = normalizeEventTime(input.eventTime);
  const pageUrl = normalizePageUrl(input.pageUrl);
  const pixelId = options.pixelId?.trim() || DEFAULT_TIKTOK_PIXEL_ID;
  const ttclid = cleanOptional(input.ttclid);
  const ttp = cleanOptional(input.ttp);
  const ip = cleanOptional(input.ip);
  const userAgent = cleanOptional(input.userAgent);

  if (!emailHash || !externalIdHash || amount === null || currency !== "TRY" || !eventTime) {
    return null;
  }

  const user: TikTokEventUser = {
    email: emailHash,
    external_id: externalIdHash,
  };

  if (ttclid) user.ttclid = ttclid;
  if (ttp) user.ttp = ttp;
  if (ip) user.ip = ip;
  if (userAgent) user.user_agent = userAgent;

  return {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "CompletePayment",
        event_time: eventTime,
        event_id: `storyofus_payment_${input.submissionId}`,
        user,
        properties: {
          currency: "TRY",
          value: amount,
          content_type: "product",
          contents: [
            {
              content_id: STORYOFUS_CONTENT_ID,
              content_name: STORYOFUS_CONTENT_NAME,
              quantity: 1,
              price: amount,
            },
          ],
          description: STORYOFUS_EVENT_DESCRIPTION,
        },
        page: {
          url: pageUrl,
        },
      },
    ],
  };
}

export function shouldSendTikTokCompletePaymentForShopierResult(result: string) {
  return result === "applied";
}

export function hashNormalizedValue(value: string) {
  const normalized = value.trim().toLowerCase();

  return normalized ? createHash("sha256").update(normalized).digest("hex") : "";
}

function normalizeAmount(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function normalizeEventTime(value: TikTokCompletePaymentInput["eventTime"]) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? Math.floor(value.getTime() / 1000) : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0
      ? Math.floor(value > 10_000_000_000 ? value / 1000 : value)
      : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);

    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
  }

  return Math.floor(Date.now() / 1000);
}

function normalizePageUrl(value: string | null | undefined) {
  const fallback = new URL("/storyofus", getStoryOfUsPublicOrigin()).toString();

  if (!value?.trim()) {
    return fallback;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function getStoryOfUsPublicOrigin() {
  const configured = process.env.STORYOFUS_PUBLIC_ORIGIN?.trim();

  if (!configured) {
    return new URL(DEFAULT_STORYOFUS_PAGE_URL).origin;
  }

  try {
    const url = new URL(configured);

    return url.protocol === "https:" ? url.origin : new URL(DEFAULT_STORYOFUS_PAGE_URL).origin;
  } catch {
    return new URL(DEFAULT_STORYOFUS_PAGE_URL).origin;
  }
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim();

  return cleaned || null;
}

async function parseTikTokResponseBody(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isTikTokSuccessResponse(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const code = value.code;
  const message = value.message;

  return code === 0 || code === "0" || message === "OK";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
