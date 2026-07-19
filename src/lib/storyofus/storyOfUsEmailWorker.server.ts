import type { StoryOfUsEmailType } from "./emailOutbox.server";
import {
  claimStoryOfUsEmailOutboxBatch,
  completeStoryOfUsEmailAttempt,
  type StoryOfUsClaimedEmailOutboxRow,
  type StoryOfUsCompleteEmailAttemptResult,
  type StoryOfUsEmailAttemptOutcome,
} from "./emailOutboxProcessing.server";
import { sendStoryOfUsEmail, type SendStoryOfUsEmailInput } from "./storyOfUsResend.server";
import { isValidStoryOfUsFinalSiteUrl } from "./finalSiteUtils";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type ProcessStoryOfUsEmailOutboxBatchInput = {
  batchSize?: number;
};

export type ProcessStoryOfUsEmailOutboxBatchResult = {
  claimed: number;
  sent: number;
  retryScheduled: number;
  dead: number;
  lockLost: number;
  processingErrors: number;
};

type StoryOfUsEmailSubmissionRow = {
  id?: unknown;
  customer_email?: unknown;
  customer_name?: unknown;
  order_reference?: unknown;
  setup_token?: unknown;
  payment_status?: unknown;
  status?: unknown;
  final_site_url?: unknown;
  delivered_at?: unknown;
};

const DEFAULT_PUBLIC_ORIGIN = "https://leony.tech";
const MAX_WORKER_BATCH_SIZE = 25;
const DEFAULT_WORKER_BATCH_SIZE = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORDER_REFERENCE_PATTERN = /^SOU-(\d{8})-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export async function processStoryOfUsEmailOutboxBatch({
  batchSize = DEFAULT_WORKER_BATCH_SIZE,
}: ProcessStoryOfUsEmailOutboxBatchInput = {}): Promise<ProcessStoryOfUsEmailOutboxBatchResult> {
  const claimedRows = await claimStoryOfUsEmailOutboxBatch({
    batchSize: normalizeBatchSize(batchSize),
  });
  const summary: ProcessStoryOfUsEmailOutboxBatchResult = {
    claimed: claimedRows.length,
    sent: 0,
    retryScheduled: 0,
    dead: 0,
    lockLost: 0,
    processingErrors: 0,
  };

  for (const claimed of claimedRows) {
    try {
      const outcome = await processClaimedStoryOfUsEmail(claimed);
      const completion = await completeStoryOfUsEmailAttempt({
        claimed,
        outcome,
      });

      applyCompletionToSummary(summary, completion);
    } catch {
      summary.processingErrors += 1;
    }
  }

  return summary;
}

async function processClaimedStoryOfUsEmail(
  claimed: StoryOfUsClaimedEmailOutboxRow,
): Promise<StoryOfUsEmailAttemptOutcome> {
  if (claimed.emailType === "order_created") {
    const input = await createOrderCreatedEmailInput(claimed);

    if (!input) {
      return {
        ok: false,
        errorCode: "invalid_input",
      };
    }

    return sendStoryOfUsEmail(input);
  }

  if (claimed.emailType === "final_site_ready") {
    const input = await createFinalSiteReadyEmailInput(claimed);

    if (!input) {
      return {
        ok: false,
        errorCode: "invalid_input",
      };
    }

    return sendStoryOfUsEmail(input);
  }

  return assertNeverEmailType(claimed.emailType);
}

async function createFinalSiteReadyEmailInput(
  claimed: StoryOfUsClaimedEmailOutboxRow,
): Promise<SendStoryOfUsEmailInput | null> {
  const submission = await loadEmailSubmission(claimed.submissionId);

  if (!submission || stringValue(submission.id) !== claimed.submissionId) {
    return null;
  }

  if (
    stringValue(submission.payment_status) !== "paid" ||
    stringValue(submission.status) !== "published" ||
    !nullableString(submission.delivered_at)
  ) {
    return null;
  }

  const customerEmail = normalizeEmail(submission.customer_email);
  const customerName = normalizeRequiredText(submission.customer_name, 160);
  const orderReference = normalizeOrderReference(submission.order_reference);
  const finalSiteUrl = normalizeFinalSiteUrl(submission.final_site_url);

  if (!customerEmail || !customerName || !orderReference || !finalSiteUrl) {
    return null;
  }

  return {
    emailType: "final_site_ready",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    finalSiteUrl,
    idempotencyKey: claimed.eventKey,
  } satisfies SendStoryOfUsEmailInput;
}

async function createOrderCreatedEmailInput(
  claimed: StoryOfUsClaimedEmailOutboxRow,
): Promise<SendStoryOfUsEmailInput | null> {
  const submission = await loadEmailSubmission(claimed.submissionId);

  if (!submission || stringValue(submission.id) !== claimed.submissionId) {
    return null;
  }

  if (stringValue(submission.payment_status) !== "paid") {
    return null;
  }

  const customerEmail = normalizeEmail(submission.customer_email);
  const customerName = normalizeRequiredText(submission.customer_name, 160);
  const orderReference = normalizeOrderReference(submission.order_reference);
  const setupToken = normalizeUuid(submission.setup_token);

  if (!customerEmail || !customerName || !orderReference || !setupToken) {
    return null;
  }

  return {
    emailType: "order_created",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    setupUrl: createStoryOfUsSetupUrl(setupToken),
    trackOrderUrl: createStoryOfUsTrackOrderUrl(),
    idempotencyKey: claimed.eventKey,
  } satisfies SendStoryOfUsEmailInput;
}

async function loadEmailSubmission(
  submissionId: string,
): Promise<StoryOfUsEmailSubmissionRow | null> {
  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_submissions")
    .select(
      [
        "id",
        "customer_email",
        "customer_name",
        "order_reference",
        "setup_token",
        "payment_status",
        "status",
        "final_site_url",
        "delivered_at",
      ].join(", "),
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw new Error("StoryOfUs email submission data could not be loaded.");
  }

  return data;
}

function normalizeFinalSiteUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return isValidStoryOfUsFinalSiteUrl(normalized) ? normalized : null;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function applyCompletionToSummary(
  summary: ProcessStoryOfUsEmailOutboxBatchResult,
  completion: StoryOfUsCompleteEmailAttemptResult,
) {
  if (!completion.ok) {
    summary.lockLost += 1;
    return;
  }

  if (completion.transition === "sent") {
    summary.sent += 1;
    return;
  }

  if (completion.transition === "retry_scheduled") {
    summary.retryScheduled += 1;
    return;
  }

  summary.dead += 1;
}

function createStoryOfUsSetupUrl(setupToken: string) {
  const url = new URL("/storyofus/setup", DEFAULT_PUBLIC_ORIGIN);
  url.searchParams.set("token", setupToken);

  return url.toString();
}

function createStoryOfUsTrackOrderUrl() {
  const url = new URL("/storyofus/track-order", DEFAULT_PUBLIC_ORIGIN);

  return url.toString();
}

function normalizeBatchSize(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_WORKER_BATCH_SIZE;
  }

  return Math.min(Math.max(Math.trunc(value), 1), MAX_WORKER_BATCH_SIZE);
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized) ? normalized : null;
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength || hasAsciiControlCharacter(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeUuid(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function normalizeOrderReference(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  return ORDER_REFERENCE_PATTERN.test(normalized) ? normalized : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function hasAsciiControlCharacter(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (typeof codePoint === "number" && (codePoint <= 0x1f || codePoint === 0x7f)) {
      return true;
    }
  }

  return false;
}

function assertNeverEmailType(emailType: never): never {
  throw new Error(`Unsupported StoryOfUs email type: ${emailType}`);
}
