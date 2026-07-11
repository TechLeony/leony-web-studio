import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import {
  parseShopierCallbackPayload,
  verifyShopierCallback,
} from "../lib/storyofus/shopierPayment.server";
import { storyOfUsSupabaseAdmin } from "../lib/storyofus/supabaseAdmin.server";

export const Route = createFileRoute("/api/storyofus/shopier/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const rawPayload = parseRawCallbackBody(rawBody, request.headers);
        const isVerified = await verifyShopierCallback(rawBody, request.headers);

        if (!isVerified) {
          return jsonResponse({ ok: false, error: "verification_failed" }, 400);
        }

        const payload = parseShopierCallbackPayload(rawPayload);

        if (!payload.orderReference) {
          return jsonResponse({ ok: false, error: "missing_order_reference" }, 400);
        }

        const { data: submission, error: loadError } = await storyOfUsSupabaseAdmin
          .from("storyofus_submissions")
          .select(
            "id, order_reference, payment_status, payment_amount, payment_currency, paid_at, payment_reference",
          )
          .eq("order_reference", payload.orderReference)
          .maybeSingle();

        if (loadError) {
          throw new Error(`StoryOfUs Shopier payment could not be loaded: ${loadError.message}`);
        }

        if (!submission) {
          return jsonResponse({ ok: false, error: "order_not_found" }, 404);
        }

        const receivedAt = new Date().toISOString();

        if (submission.payment_status === "paid") {
          await storyOfUsSupabaseAdmin
            .from("storyofus_submissions")
            .update({
              payment_callback_received_at: receivedAt,
              payment_raw_callback: payload.raw,
            })
            .eq("id", submission.id);

          return jsonResponse({ ok: true });
        }

        if (payload.status === "success") {
          const amountError = getAmountOrCurrencyError(submission, payload);

          if (amountError) {
            await updatePaymentFailure(submission.id as string, amountError, payload.raw, receivedAt);
            return jsonResponse({ ok: false, error: amountError }, 400);
          }

          await markSubmissionPaid(submission, payload, receivedAt);
          // TODO Phase 4B: send setup link email to customer_email.
          return jsonResponse({ ok: true });
        }

        if (payload.status === "failed" || payload.status === "cancelled") {
          await storyOfUsSupabaseAdmin
            .from("storyofus_submissions")
            .update({
              payment_status: payload.status === "cancelled" ? "cancelled" : "failed",
              payment_callback_received_at: receivedAt,
              payment_raw_callback: payload.raw,
              payment_error: payload.status,
            })
            .eq("id", submission.id);

          return jsonResponse({ ok: true });
        }

        await updatePaymentFailure(submission.id as string, "unhandled_payment_status", payload.raw, receivedAt);
        return jsonResponse({ ok: false, error: "unhandled_payment_status" }, 400);
      },
    },
  },
});

function parseRawCallbackBody(rawBody: string, headers: Headers) {
  const contentType = headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
}

function getAmountOrCurrencyError(
  submission: Record<string, unknown>,
  payload: ReturnType<typeof parseShopierCallbackPayload>,
) {
  const storedAmount = numberValue(submission.payment_amount);
  const storedCurrency = stringValue(submission.payment_currency).toUpperCase();

  if (storedAmount !== null && payload.amount !== null && Math.abs(storedAmount - payload.amount) > 0.01) {
    return "amount_mismatch";
  }

  if (storedCurrency && payload.currency && storedCurrency !== payload.currency.toUpperCase()) {
    return "currency_mismatch";
  }

  return null;
}

async function markSubmissionPaid(
  submission: Record<string, unknown>,
  payload: ReturnType<typeof parseShopierCallbackPayload>,
  receivedAt: string,
) {
  const { error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .update({
      payment_status: "paid",
      paid_at: submission.paid_at ?? receivedAt,
      payment_reference: payload.paymentReference ?? submission.payment_reference ?? null,
      payment_callback_received_at: receivedAt,
      payment_verified_at: receivedAt,
      payment_raw_callback: payload.raw,
      payment_error: null,
    })
    .eq("id", submission.id);

  if (error) {
    throw new Error(`StoryOfUs Shopier payment could not be marked paid: ${error.message}`);
  }
}

async function updatePaymentFailure(
  submissionId: string,
  paymentError: string,
  rawPayload: Record<string, unknown>,
  receivedAt: string,
) {
  const { error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .update({
      payment_callback_received_at: receivedAt,
      payment_raw_callback: rawPayload,
      payment_error: paymentError,
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(`StoryOfUs Shopier payment failure could not be saved: ${error.message}`);
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
