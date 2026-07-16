import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { enqueueStoryOfUsEmail } from "../lib/storyofus/emailOutbox.server";
import { storyOfUsSupabaseAdmin } from "../lib/storyofus/supabaseAdmin.server";
import {
  parseVerifiedStoryOfUsShopierWebhook,
  StoryOfUsShopierWebhookError,
  type NormalizedStoryOfUsShopierOrderWebhook,
} from "../lib/storyofus/shopierWebhook.server";

export const Route = createFileRoute("/api/storyofus/shopier/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let webhook: NormalizedStoryOfUsShopierOrderWebhook;

        try {
          webhook = await parseVerifiedStoryOfUsShopierWebhook(request);
        } catch (error) {
          return handleWebhookError(error);
        }

        const productId = webhook.lineItems[0]?.productId;

        if (!productId) {
          logVerifiedWebhookDiagnostic("shopier_webhook_invalid_verified_payload", webhook);
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }

        const lookupResult = await loadSubmissionByShopierProductId(productId);

        if (lookupResult.status === "error") {
          console.error("[StoryOfUs Shopier webhook]", {
            eventCode: "shopier_webhook_submission_lookup_failed",
          });
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }

        if (lookupResult.status === "not_found") {
          logVerifiedWebhookDiagnostic("shopier_webhook_submission_not_found", webhook);
          return jsonResponse({ ok: true });
        }

        if (lookupResult.status === "ambiguous") {
          logVerifiedWebhookDiagnostic("shopier_webhook_submission_lookup_ambiguous", webhook);
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }

        const rpcResult = await applyVerifiedShopierPayment({
          submissionId: lookupResult.submissionId,
          productId,
          webhook,
        });

        if (rpcResult.status === "error") {
          console.error("[StoryOfUs Shopier webhook]", {
            eventCode: "shopier_webhook_rpc_failed",
            submissionId: lookupResult.submissionId,
          });
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }

        if (rpcResult.status === "invalid") {
          console.error("[StoryOfUs Shopier webhook]", {
            eventCode: "shopier_webhook_rpc_invalid_response",
            submissionId: lookupResult.submissionId,
          });
          return jsonResponse({ ok: false, error: "internal_error" }, 500);
        }

        if (SUCCESSFUL_PAYMENT_RESULTS.has(rpcResult.result)) {
          const emailQueued = await ensureOrderCreatedEmailQueued(lookupResult.submissionId);

          if (!emailQueued) {
            console.error("[StoryOfUs Shopier webhook]", {
              eventCode: "shopier_webhook_email_enqueue_failed",
              submissionId: lookupResult.submissionId,
            });
            return jsonResponse({ ok: false, error: "internal_error" }, 500);
          }
        } else {
          console.warn("[StoryOfUs Shopier webhook]", {
            eventCode: `shopier_webhook_${rpcResult.result}`,
            submissionId: lookupResult.submissionId,
            eventId: webhook.eventId,
            orderId: webhook.orderId,
          });
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});

const SUCCESSFUL_PAYMENT_RESULTS = new Set<VerifiedPaymentRpcResult>([
  "applied",
  "replayed",
  "already_paid",
]);

const PERMANENT_PAYMENT_RESULTS = new Set<VerifiedPaymentRpcResult>([
  "submission_not_found",
  "provider_mismatch",
  "product_mismatch",
  "amount_mismatch",
  "currency_mismatch",
  "event_conflict",
  "payment_conflict",
]);

type VerifiedPaymentRpcResult =
  | "applied"
  | "replayed"
  | "already_paid"
  | "submission_not_found"
  | "provider_mismatch"
  | "product_mismatch"
  | "amount_mismatch"
  | "currency_mismatch"
  | "event_conflict"
  | "payment_conflict";

type SubmissionLookupResult =
  | { status: "found"; submissionId: string }
  | { status: "not_found" }
  | { status: "ambiguous" }
  | { status: "error" };

function handleWebhookError(error: unknown) {
  if (!(error instanceof StoryOfUsShopierWebhookError)) {
    console.error("[StoryOfUs Shopier webhook]", {
      eventCode: "shopier_webhook_unexpected_error",
    });
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  if (error.errorCode === "shopier_webhook_unsupported_event") {
    return jsonResponse({ ok: true });
  }

  if (error.errorCode === "shopier_webhook_unpaid_order") {
    return jsonResponse({ ok: true });
  }

  if (error.errorCode === "shopier_webhook_configuration_missing") {
    console.error("[StoryOfUs Shopier webhook]", {
      eventCode: error.errorCode,
    });
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  if (error.errorCode === "shopier_webhook_invalid_payload") {
    console.error("[StoryOfUs Shopier webhook]", {
      eventCode: "shopier_webhook_invalid_verified_payload",
    });
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  if (
    error.errorCode === "shopier_webhook_missing_signature" ||
    error.errorCode === "shopier_webhook_invalid_signature"
  ) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  return jsonResponse({ ok: false, error: "invalid_request" }, 400);
}

async function loadSubmissionByShopierProductId(
  productId: string,
): Promise<SubmissionLookupResult> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select("id")
    .eq("shopier_product_id", productId)
    .limit(2);

  if (error) {
    return { status: "error" };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { status: "not_found" };
  }

  if (data.length !== 1) {
    return { status: "ambiguous" };
  }

  const submissionId = data[0]?.id;

  if (typeof submissionId !== "string") {
    return { status: "error" };
  }

  return { status: "found", submissionId };
}

async function applyVerifiedShopierPayment({
  submissionId,
  productId,
  webhook,
}: {
  submissionId: string;
  productId: string;
  webhook: NormalizedStoryOfUsShopierOrderWebhook;
}): Promise<
  { status: "ok"; result: VerifiedPaymentRpcResult } | { status: "invalid" } | { status: "error" }
> {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc(
    "storyofus_apply_verified_shopier_payment",
    {
      p_submission_id: submissionId,
      p_shopier_product_id: productId,
      p_provider_event_id: webhook.eventId,
      p_payment_reference: webhook.orderId,
      p_received_amount: webhook.amount,
      p_received_currency: webhook.currency,
      p_received_at: new Date().toISOString(),
      p_sanitized_payload: webhook.sanitizedPayload,
    },
  );

  if (error) {
    return { status: "error" };
  }

  const result = parseRpcResult(data);

  if (!result) {
    return { status: "invalid" };
  }

  return { status: "ok", result };
}

function parseRpcResult(data: unknown): VerifiedPaymentRpcResult | null {
  const row = Array.isArray(data) && data.length === 1 ? data[0] : null;

  if (!isRecord(row) || typeof row.result !== "string") {
    return null;
  }

  if (SUCCESSFUL_PAYMENT_RESULTS.has(row.result as VerifiedPaymentRpcResult)) {
    return row.result as VerifiedPaymentRpcResult;
  }

  if (PERMANENT_PAYMENT_RESULTS.has(row.result as VerifiedPaymentRpcResult)) {
    return row.result as VerifiedPaymentRpcResult;
  }

  return null;
}

async function ensureOrderCreatedEmailQueued(submissionId: string) {
  const result = await enqueueStoryOfUsEmail({
    submissionId,
    emailType: "order_created",
  });

  return result.ok;
}

function logVerifiedWebhookDiagnostic(
  eventCode: string,
  webhook: Pick<NormalizedStoryOfUsShopierOrderWebhook, "eventId" | "orderId">,
) {
  console.warn("[StoryOfUs Shopier webhook]", {
    eventCode,
    eventId: webhook.eventId,
    orderId: webhook.orderId,
  });
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
