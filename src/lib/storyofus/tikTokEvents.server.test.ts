import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  createTikTokCompletePaymentPayload,
  hashNormalizedValue,
  sendTikTokCompletePayment,
  shouldSendTikTokCompletePaymentForShopierResult,
} from "./tikTokEvents.server.ts";

test("normalizes and hashes TikTok CompletePayment user identifiers deterministically", () => {
  const expectedEmailHash = createHash("sha256").update("customer@example.com").digest("hex");
  const expectedExternalIdHash = createHash("sha256").update("submission-123").digest("hex");

  assert.equal(hashNormalizedValue(" Customer@Example.COM "), expectedEmailHash);

  const payload = createTikTokCompletePaymentPayload({
    submissionId: "submission-123",
    customerEmail: " Customer@Example.COM ",
    amount: 199,
    currency: "TRY",
    eventTime: "2026-07-29T12:00:00.000Z",
  });

  assert.equal(payload?.data[0].user.email, expectedEmailHash);
  assert.equal(payload?.data[0].user.external_id, expectedExternalIdHash);
});

test("builds TikTok CompletePayment payload with second-based event time and numeric amount", () => {
  const payload = createTikTokCompletePaymentPayload({
    submissionId: "submission-123",
    customerEmail: "customer@example.com",
    amount: 199.005,
    currency: "try",
    eventTime: "2026-07-29T12:00:00.000Z",
    pageUrl: "https://leony.tech/storyofus",
  });

  assert.equal(payload?.event_source, "web");
  assert.equal(payload?.event_source_id, "BU35TSQHT2A1QT375GMG");
  assert.equal(payload?.data[0].event, "CompletePayment");
  assert.equal(payload?.data[0].event_time, 1785326400);
  assert.equal(payload?.data[0].event_id, "storyofus_payment_submission-123");
  assert.equal(payload?.data[0].properties.currency, "TRY");
  assert.equal(payload?.data[0].properties.value, 199.01);
  assert.equal(payload?.data[0].properties.contents[0].price, 199.01);
});

test("omits missing TikTok optional user fields instead of sending nulls", () => {
  const payload = createTikTokCompletePaymentPayload({
    submissionId: "submission-123",
    customerEmail: "customer@example.com",
    amount: 199,
    currency: "TRY",
    eventTime: 1785326400,
    ttclid: undefined,
    ttp: null,
    ip: "",
    userAgent: "  ",
  });

  assert.ok(payload);
  assert.equal("ttclid" in payload.data[0].user, false);
  assert.equal("ttp" in payload.data[0].user, false);
  assert.equal("ip" in payload.data[0].user, false);
  assert.equal("user_agent" in payload.data[0].user, false);
  assert.doesNotMatch(JSON.stringify(payload), /null/);
});

test("does not make a TikTok network request when access token is missing", async () => {
  let fetchCalled = false;
  const result = await sendTikTokCompletePayment(
    {
      submissionId: "submission-123",
      customerEmail: "customer@example.com",
      amount: 199,
      currency: "TRY",
      eventTime: 1785326400,
    },
    {
      accessToken: "",
      fetchFn: async () => {
        fetchCalled = true;
        return Response.json({ code: 0, message: "OK" });
      },
    },
  );

  assert.deepEqual(result, { ok: true, skipped: true, reason: "missing_access_token" });
  assert.equal(fetchCalled, false);
});

test("checks TikTok API body and reports API errors without throwing", async () => {
  const result = await sendTikTokCompletePayment(
    {
      submissionId: "submission-123",
      customerEmail: "customer@example.com",
      amount: 199,
      currency: "TRY",
      eventTime: 1785326400,
    },
    {
      accessToken: "test-token",
      fetchFn: async () => Response.json({ code: 40001, message: "Invalid request" }),
    },
  );

  assert.deepEqual(result, { ok: false, skipped: false, reason: "api_error" });
});

test("sends TikTok CompletePayment with Access-Token header and JSON payload", async () => {
  let capturedRequest: { url: string; init: RequestInit } | null = null;
  const result = await sendTikTokCompletePayment(
    {
      submissionId: "submission-123",
      customerEmail: "customer@example.com",
      amount: 199,
      currency: "TRY",
      eventTime: 1785326400,
      ip: "203.0.113.10",
      userAgent: "Test Agent",
    },
    {
      accessToken: "test-token",
      pixelId: "PIXEL",
      fetchFn: async (url, init) => {
        capturedRequest = { url: String(url), init: init ?? {} };
        return Response.json({ code: 0, message: "OK" });
      },
    },
  );

  assert.deepEqual(result, { ok: true, skipped: false });
  assert.equal(capturedRequest?.url, "https://business-api.tiktok.com/open_api/v1.3/event/track/");
  assert.equal(
    (capturedRequest?.init.headers as Record<string, string>)["Access-Token"],
    "test-token",
  );
  assert.equal(
    (capturedRequest?.init.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
  assert.match(String(capturedRequest?.init.body), /"event":"CompletePayment"/);
  assert.match(String(capturedRequest?.init.body), /"ip":"203.0.113.10"/);
  assert.match(String(capturedRequest?.init.body), /"user_agent":"Test Agent"/);
});

test("allows TikTok event only for the first applied Shopier payment result", () => {
  assert.equal(shouldSendTikTokCompletePaymentForShopierResult("applied"), true);
  assert.equal(shouldSendTikTokCompletePaymentForShopierResult("replayed"), false);
  assert.equal(shouldSendTikTokCompletePaymentForShopierResult("already_paid"), false);
  assert.equal(shouldSendTikTokCompletePaymentForShopierResult("amount_mismatch"), false);
});
