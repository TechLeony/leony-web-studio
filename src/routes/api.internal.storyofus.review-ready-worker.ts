import { createHash, timingSafeEqual } from "node:crypto";

import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import {
  processStoryOfUsQueuedDeliveries,
  promoteStoryOfUsReviewReadyOrders,
} from "../lib/storyofus/reviewReady.server";

export const Route = createFileRoute("/api/internal/storyofus/review-ready-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!isAuthorizedRequest(request)) {
            return jsonResponse({ ok: false, error: "unauthorized" }, 401);
          }

          if (new URL(request.url).search) {
            return jsonResponse({ ok: false, error: "invalid_request" }, 400);
          }

          const bodyIsValid = await hasEmptyOrJsonObjectBody(request);

          if (!bodyIsValid) {
            return jsonResponse({ ok: false, error: "invalid_request" }, 400);
          }

          const reviewReadySummary = await promoteStoryOfUsReviewReadyOrders(
            STORYOFUS_REVIEW_READY_WORKER_BATCH_SIZE,
            false,
          );
          const deliveryQueueSummary = await processStoryOfUsQueuedDeliveries(
            STORYOFUS_DELIVERY_QUEUE_WORKER_BATCH_SIZE,
          );

          return jsonResponse({
            ok: true,
            scanned: reviewReadySummary.eligible,
            eligible: reviewReadySummary.eligible,
            promoted: reviewReadySummary.promoted,
            skipped: reviewReadySummary.skipped,
            failed: reviewReadySummary.failed + deliveryQueueSummary.failed,
            reviewReady: {
              scanned: reviewReadySummary.eligible,
              eligible: reviewReadySummary.eligible,
              promoted: reviewReadySummary.promoted,
              skipped: reviewReadySummary.skipped,
              failed: reviewReadySummary.failed,
            },
            deliveryQueue: {
              queued: deliveryQueueSummary.queued,
              published: deliveryQueueSummary.published,
              alreadyPublished: deliveryQueueSummary.alreadyPublished,
              skipped: deliveryQueueSummary.skipped,
              failed: deliveryQueueSummary.failed,
            },
          });
        } catch {
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }
      },
    },
  },
});

const STORYOFUS_REVIEW_READY_WORKER_BATCH_SIZE = 50;
const STORYOFUS_DELIVERY_QUEUE_WORKER_BATCH_SIZE = 20;
const MIN_WORKER_SECRET_LENGTH = 32;

function isAuthorizedRequest(request: Request) {
  const configuredSecret = process.env.STORYOFUS_EMAIL_WORKER_SECRET?.trim() ?? "";
  const suppliedSecret = parseBearerSecret(request.headers.get("authorization"));

  const configuredSecretIsValid = configuredSecret.length >= MIN_WORKER_SECRET_LENGTH;
  const suppliedSecretIsValid =
    suppliedSecret !== null && suppliedSecret.length >= MIN_WORKER_SECRET_LENGTH;
  const secretsMatch = timingSafeEqual(
    hashSecret(configuredSecret),
    hashSecret(suppliedSecret ?? ""),
  );

  return configuredSecretIsValid && suppliedSecretIsValid && secretsMatch;
}

function parseBearerSecret(authorizationHeader: string | null) {
  const match = authorizationHeader?.match(/^Bearer ([^\s]+)$/i);

  if (!match) {
    return null;
  }

  return match[1];
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest();
}

async function hasEmptyOrJsonObjectBody(request: Request) {
  const contentLength = request.headers.get("content-length");
  const parsedContentLength = contentLength === null ? null : Number(contentLength);

  if (
    parsedContentLength !== null &&
    Number.isFinite(parsedContentLength) &&
    parsedContentLength === 0
  ) {
    return true;
  }

  if (!request.body) {
    return true;
  }

  try {
    const body = await request.text();

    if (!body.trim()) {
      return true;
    }

    const parsed = JSON.parse(body) as unknown;

    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  } catch {
    return false;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
