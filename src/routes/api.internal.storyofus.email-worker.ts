import { createHash, timingSafeEqual } from "node:crypto";

import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/internal/storyofus/email-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!isAuthorizedStoryOfUsEmailWorkerRequest(request)) {
            const { checkStoryOfUsEmailWorkerUnauthorizedRateLimit } =
              await import("../lib/storyofus/storyOfUsEmailWorkerRateLimit.server");
            const unauthorizedRateLimit = checkStoryOfUsEmailWorkerUnauthorizedRateLimit(request);

            if (unauthorizedRateLimit.limited) {
              return jsonResponse(
                { ok: false, error: "rate_limited" },
                429,
                unauthorizedRateLimit.retryAfterSeconds,
              );
            }

            return jsonResponse({ ok: false, error: "unauthorized" }, 401);
          }

          if (new URL(request.url).search) {
            return jsonResponse({ ok: false, error: "invalid_request" }, 400);
          }

          if (!(await hasValidStoryOfUsEmailWorkerRequestBody(request))) {
            return jsonResponse({ ok: false, error: "invalid_request" }, 400);
          }

          const { checkStoryOfUsEmailWorkerExecutionRateLimit } =
            await import("../lib/storyofus/storyOfUsEmailWorkerRateLimit.server");
          const executionRateLimit = checkStoryOfUsEmailWorkerExecutionRateLimit();

          if (executionRateLimit.limited) {
            return jsonResponse(
              { ok: false, error: "rate_limited" },
              429,
              executionRateLimit.retryAfterSeconds,
            );
          }

          const { processStoryOfUsEmailOutboxBatch } =
            await import("../lib/storyofus/storyOfUsEmailWorker.server");
          const summary = await processStoryOfUsEmailOutboxBatch({
            batchSize: STORYOFUS_EMAIL_WORKER_BATCH_SIZE,
          });

          return jsonResponse(summary);
        } catch {
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }
      },
    },
  },
});

const STORYOFUS_EMAIL_WORKER_BATCH_SIZE = 10;
const MIN_WORKER_SECRET_LENGTH = 32;

export function isAuthorizedStoryOfUsEmailWorkerRequest(request: Request) {
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

export async function hasValidStoryOfUsEmailWorkerRequestBody(request: Request) {
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

    return Boolean(
      parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        Object.keys(parsed).length === 0,
    );
  } catch {
    return false;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200, retryAfterSeconds?: number) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  });

  if (retryAfterSeconds) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}
