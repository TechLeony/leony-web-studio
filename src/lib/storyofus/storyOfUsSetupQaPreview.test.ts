import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STORYOFUS_SETUP_QA_PATH,
  getStoryOfUsSetupQaStates,
  isStoryOfUsSetupQaAllowed,
} from "./storyOfUsSetupQaPreview.ts";
import {
  getStoryOfUsEditSubmissionConfirmationCopy,
  getStoryOfUsSetupReviewSubmitCopy,
} from "./setupSuccessCopy.ts";

const REQUIRED_STATE_IDS = [
  "submitted_reentry_open_0",
  "submitted_reentry_open_1",
  "edit_limit_reached",
  "deadline_expired_0",
  "deadline_expired_1",
  "admin_locked",
  "first_submit_success",
  "first_edit_success",
  "second_edit_success",
  "first_edit_confirmation",
  "final_edit_confirmation",
  "initial_submit_review",
  "submitted_edit_review",
];

test("StoryOfUs setup QA route path is internal", () => {
  assert.equal(STORYOFUS_SETUP_QA_PATH, "/storyofus/internal/setup-qa");
});

test("StoryOfUs setup QA is allowed outside production and denied in Vercel Production", () => {
  assert.equal(isStoryOfUsSetupQaAllowed({ VERCEL_ENV: "preview", NODE_ENV: "production" }), true);
  assert.equal(
    isStoryOfUsSetupQaAllowed({ VERCEL_ENV: "development", NODE_ENV: "development" }),
    true,
  );
  assert.equal(isStoryOfUsSetupQaAllowed({ NODE_ENV: "development" }), true);
  assert.equal(
    isStoryOfUsSetupQaAllowed({ VERCEL_ENV: "production", NODE_ENV: "production" }),
    false,
  );
  assert.equal(isStoryOfUsSetupQaAllowed(null), false);
});

test("StoryOfUs setup QA exposes all required visual states", () => {
  const states = getStoryOfUsSetupQaStates();

  assert.deepEqual(
    states.map((state) => state.id),
    REQUIRED_STATE_IDS,
  );
});

test("StoryOfUs setup QA review states use existing customer-facing review copy", () => {
  const states = getStoryOfUsSetupQaStates();
  const initialReview = states.find((state) => state.id === "initial_submit_review");
  const submittedReview = states.find((state) => state.id === "submitted_edit_review");

  assert.equal(initialReview?.kind, "review");
  assert.equal(initialReview?.body, getStoryOfUsSetupReviewSubmitCopy(false));
  assert.equal(submittedReview?.kind, "review");
  assert.equal(submittedReview?.body, getStoryOfUsSetupReviewSubmitCopy(true));
});

test("StoryOfUs setup QA dialog states use existing confirmation copy", () => {
  const states = getStoryOfUsSetupQaStates();
  const firstDialog = states.find((state) => state.id === "first_edit_confirmation");
  const finalDialog = states.find((state) => state.id === "final_edit_confirmation");

  assert.equal(firstDialog?.kind, "dialog");
  assert.deepEqual(
    {
      title: firstDialog?.title,
      body: firstDialog?.body,
      confirmLabel: firstDialog?.kind === "dialog" ? firstDialog.confirmLabel : null,
    },
    getStoryOfUsEditSubmissionConfirmationCopy({ editsUsed: 0, editLimit: 2 }),
  );
  assert.equal(finalDialog?.kind, "dialog");
  assert.deepEqual(
    {
      title: finalDialog?.title,
      body: finalDialog?.body,
      confirmLabel: finalDialog?.kind === "dialog" ? finalDialog.confirmLabel : null,
    },
    getStoryOfUsEditSubmissionConfirmationCopy({ editsUsed: 1, editLimit: 2 }),
  );
});

test("StoryOfUs setup QA helper does not import mutation or integration modules", () => {
  const source = readFileSync(new URL("./storyOfUsSetupQaPreview.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /supabase/i);
  assert.doesNotMatch(source, /shopier/i);
  assert.doesNotMatch(source, /emailOutbox|Resend|storyOfUsEmailWorker/i);
  assert.doesNotMatch(source, /mediaUpload|submitSetup|createCheckoutOrder|publish/i);
});
