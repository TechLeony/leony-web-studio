import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createStoryOfUsEmailEventKey, isValidStoryOfUsEmailEventKey } from "./emailOutboxTypes.ts";

const workspaceRoot = process.cwd();
const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";

test("normal checkout_created event key validates", () => {
  assert.equal(
    isValidStoryOfUsEmailEventKey({
      eventKey: createStoryOfUsEmailEventKey(SUBMISSION_ID, "checkout_created"),
      emailType: "checkout_created",
      submissionId: SUBMISSION_ID,
    }),
    true,
  );
});

test("delayed checkout_created event key validates", () => {
  assert.equal(
    isValidStoryOfUsEmailEventKey({
      eventKey: `storyofus:checkout_created:delayed:${SUBMISSION_ID}`,
      emailType: "checkout_created",
      submissionId: SUBMISSION_ID,
    }),
    true,
  );
});

test("delayed event key is rejected for other email types", () => {
  for (const emailType of [
    "payment_reminder",
    "order_created",
    "setup_submitted",
    "final_site_ready",
  ] as const) {
    assert.equal(
      isValidStoryOfUsEmailEventKey({
        eventKey: `storyofus:checkout_created:delayed:${SUBMISSION_ID}`,
        emailType,
        submissionId: SUBMISSION_ID,
      }),
      false,
    );
  }
});

test("malformed delayed event keys are rejected", () => {
  const malformedKeys = [
    `storyofus:checkout_created:delayed`,
    `storyofus:checkout_created:delayed:${SUBMISSION_ID}:extra`,
    `storyofus:checkout_created:delay:${SUBMISSION_ID}`,
    `storyofus:checkout_created:delayed:not-a-uuid`,
  ];

  for (const eventKey of malformedKeys) {
    assert.equal(
      isValidStoryOfUsEmailEventKey({
        eventKey,
        emailType: "checkout_created",
        submissionId: SUBMISSION_ID,
      }),
      false,
    );
  }
});

test("email type mismatch is rejected", () => {
  assert.equal(
    isValidStoryOfUsEmailEventKey({
      eventKey: createStoryOfUsEmailEventKey(SUBMISSION_ID, "order_created"),
      emailType: "checkout_created",
      submissionId: SUBMISSION_ID,
    }),
    false,
  );
});

test("valid delayed row can reach the checkout_created send path", () => {
  const processingSource = readStoryOfUsSource("emailOutboxProcessing.server.ts");
  const workerSource = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");

  assert.match(processingSource, /isValidStoryOfUsEmailEventKey/);
  assert.match(workerSource, /claimed\.emailType === "checkout_created"/);
  assert.match(workerSource, /delayedDeliveryNotice:\s*isDelayedCheckoutCreatedBackfillEventKey/);
  assert.doesNotMatch(processingSource, /`storyofus:\$\{emailType\}:\$\{submissionId\}`/);
});

test("post-claim processing errors are completed through the retry lifecycle", () => {
  const workerSource = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");

  assert.match(workerSource, /catch \{\s*summary\.processingErrors \+= 1;/);
  assert.match(workerSource, /errorCode:\s*"provider_error"/);
  assert.match(workerSource, /applyCompletionToSummary\(summary, completion\)/);
});

function readStoryOfUsSource(filename: string) {
  return readFileSync(join(workspaceRoot, "src", "lib", "storyofus", filename), "utf8");
}
