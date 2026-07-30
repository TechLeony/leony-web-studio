import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isEligibleForStoryOfUsPaymentReminderQueue } from "./paymentReminder.ts";

const workspaceRoot = process.cwd();
const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";
const NOW = new Date("2026-07-30T12:00:00.000Z");
const OLD_CREATED_AT = "2026-07-29T11:59:59.000Z";
const YOUNG_CREATED_AT = "2026-07-29T12:00:01.000Z";
const FUTURE_CHECKOUT_EXPIRES_AT = "2026-07-30T12:30:00.000Z";
const PAST_CHECKOUT_EXPIRES_AT = "2026-07-30T11:59:59.000Z";
const PAYMENT_URL = "https://www.shopier.com/ShowProductNew/products.php?id=123456";

test("unpaid order older than 24 hours is eligible for one payment reminder", () => {
  assert.equal(isEligibleForStoryOfUsPaymentReminderQueue(createCandidate(), NOW), true);
});

test("unpaid order younger than 24 hours is not eligible", () => {
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(
      createCandidate({
        created_at: YOUNG_CREATED_AT,
      }),
      NOW,
    ),
    false,
  );
});

test("paid, failed, refunded, cancelled, and non-draft orders are not eligible", () => {
  for (const payment_status of ["paid", "failed", "refunded", "cancelled"]) {
    assert.equal(
      isEligibleForStoryOfUsPaymentReminderQueue(createCandidate({ payment_status }), NOW),
      false,
    );
  }

  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(createCandidate({ status: "submitted" }), NOW),
    false,
  );
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(
      createCandidate({ refund_status: "requested" }),
      NOW,
    ),
    false,
  );
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(
      createCandidate({ checkout_expires_at: PAST_CHECKOUT_EXPIRES_AT }),
      NOW,
    ),
    false,
  );
});

test("missing email or payment URL fails safely", () => {
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(createCandidate({ customer_email: "" }), NOW),
    false,
  );
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(createCandidate({ shopier_payment_url: "" }), NOW),
    false,
  );
  assert.equal(
    isEligibleForStoryOfUsPaymentReminderQueue(
      createCandidate({ shopier_payment_url: "https://example.com/pay" }),
      NOW,
    ),
    false,
  );
});

test("payment reminder queueing uses existing outbox idempotency and no direct transport", () => {
  const queueSource = readStoryOfUsSource("paymentReminder.server.ts");
  const outboxSource = readStoryOfUsSource("emailOutbox.server.ts");

  assert.match(queueSource, /emailType:\s*"payment_reminder"/);
  assert.match(queueSource, /loadExistingPaymentReminderSubmissionIds/);
  assert.match(outboxSource, /unique|isUniqueViolation|already_queued/s);
  assert.doesNotMatch(queueSource, /sendStoryOfUsEmail|Resend|fetch\(/);
});

test("email worker queues due reminders before claiming and re-checks pending status before send", () => {
  const workerSource = readStoryOfUsSource("storyOfUsEmailWorker.server.ts");
  const branchStart = workerSource.indexOf('if (claimed.emailType === "payment_reminder")');
  const branchEnd = workerSource.indexOf('if (claimed.emailType === "order_created")');
  const reminderInputStart = workerSource.indexOf("async function createPaymentReminderEmailInput");
  const reminderInputEnd = workerSource.indexOf("async function createOrderCreatedEmailInput");
  const reminderBranch = workerSource.slice(branchStart, branchEnd);
  const reminderInput = workerSource.slice(reminderInputStart, reminderInputEnd);

  assert.match(workerSource, /enqueueDueStoryOfUsPaymentReminders/);
  assert.match(reminderBranch, /sendStoryOfUsEmail\(input\)/);
  assert.match(reminderInput, /isEligibleForStoryOfUsPaymentReminderQueue\(submission\)/);
  assert.match(reminderInput, /normalizeShopierPaymentUrl\(submission\.shopier_payment_url\)/);
  assert.doesNotMatch(reminderInput, /setupUrl|setup_token|finalSiteUrl/);
});

test("payment reminder migration and source constraints allow the new email type once", () => {
  const migration = readMigration("payment-reminder-email.sql");
  const lifecycleMigration = readMigration("email-outbox-customer-lifecycle.sql");
  const foundation = readMigration("email-outbox.sql");

  assert.match(migration, /'payment_reminder'/);
  assert.match(lifecycleMigration, /'payment_reminder'/);
  assert.match(foundation, /'payment_reminder'/);
  assert.match(migration, /alter table public\.storyofus_email_outbox/i);
  assert.doesNotMatch(migration, /insert into|update public\.storyofus_submissions/i);
});

function createCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: SUBMISSION_ID,
    created_at: OLD_CREATED_AT,
    customer_email: "elif@example.com",
    payment_status: "pending",
    status: "draft",
    refund_status: "none",
    checkout_expires_at: FUTURE_CHECKOUT_EXPIRES_AT,
    shopier_payment_url: PAYMENT_URL,
    ...overrides,
  };
}

function readStoryOfUsSource(filename: string) {
  return readFileSync(join(workspaceRoot, "src", "lib", "storyofus", filename), "utf8");
}

function readMigration(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "storyofus", filename), "utf8");
}
