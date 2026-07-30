import { enqueueStoryOfUsEmail } from "./emailOutbox.server";
import {
  isEligibleForStoryOfUsPaymentReminderQueue,
  STORYOFUS_PAYMENT_REMINDER_DELAY_MS,
  type StoryOfUsPaymentReminderCandidate,
} from "./paymentReminder";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type EnqueueDueStoryOfUsPaymentRemindersResult = {
  scanned: number;
  queued: number;
  alreadyQueued: number;
  skipped: number;
  failed: number;
};

const MAX_PAYMENT_REMINDER_SCAN_LIMIT = 50;
const DEFAULT_PAYMENT_REMINDER_SCAN_LIMIT = 25;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function enqueueDueStoryOfUsPaymentReminders({
  now = new Date(),
  scanLimit = DEFAULT_PAYMENT_REMINDER_SCAN_LIMIT,
}: {
  now?: Date;
  scanLimit?: number;
} = {}): Promise<EnqueueDueStoryOfUsPaymentRemindersResult> {
  const safeNow = isValidDate(now) ? now : new Date();
  const dueBefore = new Date(safeNow.getTime() - STORYOFUS_PAYMENT_REMINDER_DELAY_MS).toISOString();
  const limit = normalizeScanLimit(scanLimit);
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select(
      [
        "id",
        "created_at",
        "customer_email",
        "payment_status",
        "status",
        "refund_status",
        "checkout_expires_at",
        "shopier_payment_url",
      ].join(", "),
    )
    .eq("payment_status", "pending")
    .eq("status", "draft")
    .in("refund_status", ["none", "rejected"])
    .lte("created_at", dueBefore)
    .gt("checkout_expires_at", safeNow.toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("StoryOfUs payment reminder candidates could not be loaded.");
  }

  const candidates = (data ?? []) as StoryOfUsPaymentReminderCandidate[];
  const existingReminderSubmissionIds = await loadExistingPaymentReminderSubmissionIds(
    candidates.map((candidate) => stringValue(candidate.id)).filter(isUuid),
  );
  const summary: EnqueueDueStoryOfUsPaymentRemindersResult = {
    scanned: candidates.length,
    queued: 0,
    alreadyQueued: 0,
    skipped: 0,
    failed: 0,
  };

  for (const candidate of candidates) {
    const submissionId = stringValue(candidate.id).trim().toLowerCase();

    if (
      !isEligibleForStoryOfUsPaymentReminderQueue(candidate, safeNow) ||
      existingReminderSubmissionIds.has(submissionId)
    ) {
      summary.skipped += 1;
      continue;
    }

    const result = await enqueueStoryOfUsEmail({
      submissionId,
      emailType: "payment_reminder",
    });

    if (result.ok && result.queued) {
      summary.queued += 1;
      continue;
    }

    if (result.ok && !result.queued) {
      summary.alreadyQueued += 1;
      continue;
    }

    summary.failed += 1;
  }

  return summary;
}

async function loadExistingPaymentReminderSubmissionIds(submissionIds: string[]) {
  const existing = new Set<string>();

  if (submissionIds.length === 0) {
    return existing;
  }

  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_email_outbox")
    .select("submission_id")
    .eq("email_type", "payment_reminder")
    .in("submission_id", submissionIds);

  if (error) {
    return existing;
  }

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const submissionId = stringValue(row.submission_id).trim().toLowerCase();

    if (isUuid(submissionId)) {
      existing.add(submissionId);
    }
  }

  return existing;
}

function normalizeScanLimit(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_PAYMENT_REMINDER_SCAN_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(value), 1), MAX_PAYMENT_REMINDER_SCAN_LIMIT);
}

function isValidDate(value: Date) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim().toLowerCase());
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
