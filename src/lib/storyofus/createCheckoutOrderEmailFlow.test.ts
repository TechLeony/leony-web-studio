import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();

test("checkout flow queues the pre-payment email only after Shopier URL persistence", () => {
  const source = readStoryOfUsSource("createCheckoutOrder.server.ts");
  const productPersistIndex = source.indexOf(
    "const shopierProduct = await createAndPersistShopierProduct",
  );
  const enqueueIndex = source.indexOf("await enqueueCheckoutCreatedEmailQuietly(submissionId);");
  const returnPaymentUrlIndex = source.indexOf("shopierPaymentUrl: shopierProduct.paymentUrl");

  assert.notEqual(productPersistIndex, -1);
  assert.notEqual(enqueueIndex, -1);
  assert.notEqual(returnPaymentUrlIndex, -1);
  assert.ok(productPersistIndex < enqueueIndex);
  assert.ok(enqueueIndex < returnPaymentUrlIndex);
});

test("checkout remains unexpired long enough for a 24-hour payment reminder", () => {
  const source = readStoryOfUsSource("createCheckoutOrder.server.ts");

  assert.match(source, /Date\.now\(\) \+ 48 \* 60 \* 60 \* 1000/);
});

test("failed Shopier product creation happens before checkout_created enqueue is reachable", () => {
  const source = readStoryOfUsSource("createCheckoutOrder.server.ts");
  const productPersistIndex = source.indexOf(
    "const shopierProduct = await createAndPersistShopierProduct",
  );
  const enqueueIndex = source.indexOf("await enqueueCheckoutCreatedEmailQuietly(submissionId);");
  const errorThrowIndex = source.indexOf("throw new Error(GENERIC_PAYMENT_PREPARATION_ERROR);");

  assert.notEqual(productPersistIndex, -1);
  assert.notEqual(enqueueIndex, -1);
  assert.notEqual(errorThrowIndex, -1);
  assert.ok(productPersistIndex < enqueueIndex);
});

test("checkout_created outbox enqueue uses the shared idempotent event key", () => {
  const checkoutSource = readStoryOfUsSource("createCheckoutOrder.server.ts");
  const outboxSource = readStoryOfUsSource("emailOutbox.server.ts");
  const typesSource = readStoryOfUsSource("emailOutboxTypes.ts");

  assert.match(checkoutSource, /emailType:\s*"checkout_created"/);
  assert.match(outboxSource, /createStoryOfUsEmailEventKey\(normalizedSubmissionId,\s*emailType\)/);
  assert.match(outboxSource, /\.insert\(\{\s*submission_id:\s*normalizedSubmissionId,/s);
  assert.match(outboxSource, /isUniqueViolation\(error\)/);
  assert.match(typesSource, /`storyofus:\$\{emailType\}:\$\{submissionId\}`/);
});

test("email worker renders checkout_created only for unpaid orders with stored Shopier URL", () => {
  const source = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");

  assert.match(source, /claimed\.emailType === "checkout_created"/);
  assert.match(source, /stringValue\(submission\.payment_status\) !== "pending"/);
  assert.match(source, /normalizeShopierPaymentUrl\(submission\.shopier_payment_url\)/);
  assert.match(source, /createStoryOfUsTrackOrderUrl\(trackingCode\)/);
  assert.doesNotMatch(
    source.slice(
      source.indexOf("async function createCheckoutCreatedEmailInput"),
      source.indexOf("async function createOrderCreatedEmailInput"),
    ),
    /setupUrl|setup_token/,
  );
});

function readStoryOfUsSource(filename: string) {
  return readFileSync(join(workspaceRoot, "src", "lib", "storyofus", filename), "utf8");
}
