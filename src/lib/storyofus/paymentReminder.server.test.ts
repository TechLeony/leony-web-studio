import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { isEligibleForStoryOfUsPaymentReminderQueue } from "./paymentReminder.ts";
import {
  hasValidStoryOfUsEmailWorkerRequestBody,
  isAuthorizedStoryOfUsEmailWorkerRequest,
} from "../../routes/api.internal.storyofus.email-worker.ts";

const workspaceRoot = process.cwd();
const SUBMISSION_ID = "123e4567-e89b-42d3-a456-426614174000";
const NOW = new Date("2026-07-30T12:00:00.000Z");
const OLD_CREATED_AT = "2026-07-29T11:59:59.000Z";
const YOUNG_CREATED_AT = "2026-07-29T12:00:01.000Z";
const FUTURE_CHECKOUT_EXPIRES_AT = "2026-07-30T12:30:00.000Z";
const PAST_CHECKOUT_EXPIRES_AT = "2026-07-30T11:59:59.000Z";
const PAYMENT_URL = "https://www.shopier.com/ShowProductNew/products.php?id=123456";
const VALID_WORKER_SECRET = "abcdefghijklmnopqrstuvwxyz123456";

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
  const routeSource = readRouteSource("api.internal.storyofus.email-worker.ts");
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
  assert.match(routeSource, /STORYOFUS_EMAIL_WORKER_SECRET/);
  assert.match(routeSource, /hasValidStoryOfUsEmailWorkerRequestBody/);
  assert.match(routeSource, /Object\.keys\(parsed\)\.length === 0/);
  assert.doesNotMatch(routeSource, /\bGET\s*:/);
});

test("email worker POST auth accepts only the configured bearer secret", () => {
  const previousSecret = process.env.STORYOFUS_EMAIL_WORKER_SECRET;
  process.env.STORYOFUS_EMAIL_WORKER_SECRET = VALID_WORKER_SECRET;

  try {
    assert.equal(
      isAuthorizedStoryOfUsEmailWorkerRequest(createEmailWorkerRequest()),
      true,
    );
    assert.equal(
      isAuthorizedStoryOfUsEmailWorkerRequest(createEmailWorkerRequest({ auth: null })),
      false,
    );
    assert.equal(
      isAuthorizedStoryOfUsEmailWorkerRequest(createEmailWorkerRequest({ auth: "Bearer wrong" })),
      false,
    );
    assert.equal(
      isAuthorizedStoryOfUsEmailWorkerRequest(
        createEmailWorkerRequest({ auth: "Basic " + VALID_WORKER_SECRET }),
      ),
      false,
    );

    process.env.STORYOFUS_EMAIL_WORKER_SECRET = "";
    assert.equal(
      isAuthorizedStoryOfUsEmailWorkerRequest(createEmailWorkerRequest()),
      false,
    );
  } finally {
    restoreEnv("STORYOFUS_EMAIL_WORKER_SECRET", previousSecret);
  }
});

test("email worker POST body accepts no body, whitespace, and empty JSON object only", async () => {
  const previousSecret = process.env.STORYOFUS_EMAIL_WORKER_SECRET;
  process.env.STORYOFUS_EMAIL_WORKER_SECRET = VALID_WORKER_SECRET;

  try {
    for (const body of [undefined, "", "   \n\t  ", "{}", "{ }"]) {
      const request = createEmailWorkerRequest({ body });

      assert.equal(isAuthorizedStoryOfUsEmailWorkerRequest(request), true);
      assert.equal(await hasValidStoryOfUsEmailWorkerRequestBody(request), true);
    }

    for (const body of ['{"scanLimit":1}', '{"ok":false}', "[]", "null", "true", "{", "plain"]) {
      const request = createEmailWorkerRequest({ body });

      assert.equal(await hasValidStoryOfUsEmailWorkerRequestBody(request), false);
    }
  } finally {
    restoreEnv("STORYOFUS_EMAIL_WORKER_SECRET", previousSecret);
  }
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

test("payment reminder email worker has an idempotent production cron definition", () => {
  const cronSql = readMigration("email-worker-cron.sql");
  const migrationSql = readMigrationFile("20260802204000_storyofus_email_worker_cron.sql");

  assert.equal(cronSql, migrationSql);

  for (const sql of [cronSql, migrationSql]) {
    assert.match(sql, /storyofus-email-worker-every-minute/);
    assert.match(sql, /'\* \* \* \* \*'/);
    assert.match(sql, /https:\/\/leony\.tech\/api\/internal\/storyofus\/email-worker/);
    assert.match(sql, /storyofus_email_worker_secret/);
    assert.match(sql, /pg_catalog\.length\(decrypted_secret\) >= 32/);
    assert.match(sql, /cron\.unschedule\(v_existing_job_id\)/);
    assert.match(sql, /command ilike '%\/api\/internal\/storyofus\/email-worker%'/);
    assert.match(sql, /body := '\{\}'::jsonb/);
    assert.match(sql, /timeout_milliseconds := 30000/);
    assert.doesNotMatch(sql, /RESEND_API_KEY|SHOPIER_ACCESS_TOKEN|customer_email/i);
    assert.doesNotMatch(sql, /insert into public\.storyofus_email_outbox/i);
  }
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

function readMigrationFile(filename: string) {
  return readFileSync(join(workspaceRoot, "supabase", "migrations", filename), "utf8");
}

function readRouteSource(filename: string) {
  return readFileSync(join(workspaceRoot, "src", "routes", filename), "utf8");
}

function createEmailWorkerRequest({
  auth = "Bearer " + VALID_WORKER_SECRET,
  body,
}: {
  auth?: string | null;
  body?: string;
} = {}) {
  const headers = new Headers();

  if (auth !== null) {
    headers.set("Authorization", auth);
  }

  if (body === undefined) {
    return new Request("https://leony.tech/api/internal/storyofus/email-worker", {
      method: "POST",
      headers,
    });
  }

  headers.set("Content-Type", "application/json");

  return new Request("https://leony.tech/api/internal/storyofus/email-worker", {
    method: "POST",
    headers,
    body,
  });
}

function restoreEnv(name: string, previousValue: string | undefined) {
  if (previousValue === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = previousValue;
}
