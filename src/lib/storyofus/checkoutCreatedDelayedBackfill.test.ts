import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";

test("delayed checkout-created backfill event key is explicit and submission scoped", () => {
  const source = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");

  assert.match(source, /function createDelayedCheckoutCreatedBackfillEventKey/);
  assert.match(source, /`storyofus:checkout_created:delayed:\$\{submissionId\}`/);
  assert.equal(
    `storyofus:checkout_created:delayed:${SUBMISSION_ID}`,
    ["storyofus", "checkout_created", "delayed", SUBMISSION_ID].join(":"),
  );
});

test("normal checkout enqueue does not use the delayed backfill event key", () => {
  const source = readStoryOfUsSource("createCheckoutOrder.server.ts");

  assert.match(source, /emailType:\s*"checkout_created"/);
  assert.doesNotMatch(source, /checkout_created:delayed/);
  assert.doesNotMatch(source, /delayedDeliveryNotice/);
});

test("email worker enables delayed notice only for the explicit delayed event key", () => {
  const source = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");
  const delayedHelperStart = source.indexOf("function isDelayedCheckoutCreatedBackfillEventKey");
  const delayedHelperEnd = source.indexOf(
    "function createDelayedCheckoutCreatedBackfillEventKey",
    delayedHelperStart,
  );
  const checkoutCreatedStart = source.indexOf("function createCheckoutCreatedEmailInput");
  const checkoutCreatedEnd = source.indexOf(
    "function createPaymentReminderEmailInput",
    checkoutCreatedStart,
  );

  assert.ok(delayedHelperStart >= 0);
  assert.ok(delayedHelperEnd > delayedHelperStart);
  assert.ok(checkoutCreatedStart >= 0);
  assert.ok(checkoutCreatedEnd > checkoutCreatedStart);

  const delayedHelperSource = source.slice(delayedHelperStart, delayedHelperEnd);
  const checkoutCreatedSource = source.slice(checkoutCreatedStart, checkoutCreatedEnd);

  assert.match(
    delayedHelperSource,
    /claimed\.eventKey === createDelayedCheckoutCreatedBackfillEventKey\(claimed\.submissionId\)/,
  );
  assert.match(
    checkoutCreatedSource,
    /delayedDeliveryNotice:\s*isDelayedCheckoutCreatedBackfillEventKey/,
  );
  assert.doesNotMatch(
    `${delayedHelperSource}\n${checkoutCreatedSource}`,
    /created_at|checkout_expires_at|Date\.now\(\)/,
  );
});

test("one-time delayed checkout SQL targets one exact eligible pending submission", () => {
  const sql = readStoryOfUsSql("checkout-created-delayed-one-time.sql");

  assert.match(sql, /where submission\.id = '00000000-0000-0000-0000-000000000000'::uuid/);
  assert.match(sql, /submission\.payment_status = 'pending'/);
  assert.match(sql, /submission\.status = 'draft'/);
  assert.match(sql, /submission\.checkout_expires_at > now\(\)/);
  assert.match(
    sql,
    /submission\.shopier_payment_url ~\* '\^https:\/\/\(www\\\.\)\?shopier\\\.com\/'/,
  );
  assert.match(sql, /email_type = 'checkout_created'/);
  assert.match(sql, /storyofus:checkout_created:delayed:/);
  assert.match(sql, /on conflict \(submission_id, email_type\) do nothing/);
  assert.doesNotMatch(sql, /setup_token|setup_url|final_site_url|published_at/);
});

function readStoryOfUsSource(filename: string) {
  return readFileSync(join(workspaceRoot, "src", "lib", "storyofus", filename), "utf8");
}

function readStoryOfUsSql(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "storyofus", filename), "utf8");
}
