import test from "node:test";
import assert from "node:assert/strict";

import { getSuccessfulShopierPaymentEmailEnqueueOutcome } from "./shopierWebhookEmailResult.ts";

test("successful verified payment acknowledges webhook when order_created email queues", () => {
  assert.deepEqual(getSuccessfulShopierPaymentEmailEnqueueOutcome(true), {
    acknowledgeWebhook: true,
    emailQueued: true,
  });
});

test("successful verified payment still acknowledges webhook when order_created email enqueue fails", () => {
  assert.deepEqual(getSuccessfulShopierPaymentEmailEnqueueOutcome(false), {
    acknowledgeWebhook: true,
    emailQueued: false,
  });
});
