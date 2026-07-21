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
  tracking_code?: unknown;
  setup_token?: unknown;
  payment_status?: unknown;
  status?: unknown;
  submitted_at?: unknown;
  editable_until?: unknown;
  refund_request_until?: unknown;
  final_site_url?: unknown;
  delivered_at?: unknown;
  shopier_payment_url?: unknown;
  site_passcode_hint?: unknown;
};

const DEFAULT_PUBLIC_ORIGIN = "https://leony.tech";
const MAX_WORKER_BATCH_SIZE = 25;
const DEFAULT_WORKER_BATCH_SIZE = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORDER_REFERENCE_PATTERN = /^SOU-(\d{8})-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const TRACKING_CODE_PATTERN = /^SOT-(\d{8})-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

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
  if (claimed.emailType === "checkout_created") {
    const input = await createCheckoutCreatedEmailInput(claimed);

    if (!input) {
      return {
        ok: false,
        errorCode: "invalid_input",
      };
    }

    return sendStoryOfUsEmail(input);
  }

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

  if (claimed.emailType === "setup_submitted") {
    const input = await createSetupSubmittedEmailInput(claimed);

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
  const passcodeHint = normalizeOptionalText(submission.site_passcode_hint, 120);

  if (!customerEmail || !customerName || !orderReference || !finalSiteUrl) {
    return null;
  }

  return {
    emailType: "final_site_ready",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    finalSiteUrl,
    passcodeHint: passcodeHint ?? undefined,
    idempotencyKey: claimed.eventKey,
  } satisfies SendStoryOfUsEmailInput;
}

async function createCheckoutCreatedEmailInput(
  claimed: StoryOfUsClaimedEmailOutboxRow,
): Promise<SendStoryOfUsEmailInput | null> {
  const submission = await loadEmailSubmission(claimed.submissionId);

  if (!submission || stringValue(submission.id) !== claimed.submissionId) {
    return null;
  }

  if (stringValue(submission.payment_status) !== "pending") {
    return null;
  }

  const customerEmail = normalizeEmail(submission.customer_email);
  const customerName = normalizeRequiredText(submission.customer_name, 160);
  const orderReference = normalizeOrderReference(submission.order_reference);
  const trackingCode = normalizeTrackingCode(submission.tracking_code);
  const shopierPaymentUrl = normalizeShopierPaymentUrl(submission.shopier_payment_url);

  if (!customerEmail || !customerName || !orderReference || !trackingCode || !shopierPaymentUrl) {
    return null;
  }

  return {
    emailType: "checkout_created",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    trackingCode,
    shopierPaymentUrl,
    trackOrderUrl: createStoryOfUsTrackOrderUrl(trackingCode),
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
  const trackingCode = normalizeTrackingCode(submission.tracking_code);
  const setupToken = normalizeUuid(submission.setup_token);

  if (!customerEmail || !customerName || !orderReference || !trackingCode || !setupToken) {
    return null;
  }

  return {
    emailType: "order_created",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    trackingCode,
    setupUrl: createStoryOfUsSetupUrl(setupToken),
    trackOrderUrl: createStoryOfUsTrackOrderUrl(trackingCode),
    idempotencyKey: claimed.eventKey,
  } satisfies SendStoryOfUsEmailInput;
}

async function createSetupSubmittedEmailInput(
  claimed: StoryOfUsClaimedEmailOutboxRow,
): Promise<SendStoryOfUsEmailInput | null> {
  const submission = await loadEmailSubmission(claimed.submissionId);

  if (!submission || stringValue(submission.id) !== claimed.submissionId) {
    return null;
  }

  if (
    stringValue(submission.payment_status) !== "paid" ||
    stringValue(submission.status) !== "submitted" ||
    !nullableString(submission.submitted_at)
  ) {
    return null;
  }

  const customerEmail = normalizeEmail(submission.customer_email);
  const customerName = normalizeRequiredText(submission.customer_name, 160);
  const orderReference = normalizeOrderReference(submission.order_reference);
  const trackingCode = normalizeTrackingCode(submission.tracking_code);
  const setupToken = normalizeUuid(submission.setup_token);
  const editableUntil = normalizeIsoTimestamp(submission.editable_until);
  const refundRequestUntil =
    normalizeIsoTimestamp(submission.refund_request_until) ?? editableUntil;

  if (
    !customerEmail ||
    !customerName ||
    !orderReference ||
    !trackingCode ||
    !setupToken ||
    !editableUntil
  ) {
    return null;
  }

  return {
    emailType: "setup_submitted",
    recipientEmail: customerEmail,
    customerName,
    orderReference,
    trackingCode,
    setupUrl: createStoryOfUsSetupUrl(setupToken),
    trackOrderUrl: createStoryOfUsTrackOrderUrl(trackingCode),
    editableUntil,
    editableUntilLabel: formatStoryOfUsEmailDateTime(editableUntil),
    refundRequestUntil,
    refundRequestUntilLabel: formatStoryOfUsEmailDateTime(refundRequestUntil),
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
        "tracking_code",
        "setup_token",
        "payment_status",
        "status",
        "submitted_at",
        "editable_until",
        "refund_request_until",
        "final_site_url",
        "delivered_at",
        "shopier_payment_url",
        "site_passcode_hint",
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

function createStoryOfUsTrackOrderUrl(trackingCode: string) {
  const url = new URL("/storyofus/track-order", DEFAULT_PUBLIC_ORIGIN);
  url.searchParams.set("code", trackingCode);

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

function normalizeOptionalText(value: unknown, maxLength: number) {
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

function normalizeTrackingCode(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  return TRACKING_CODE_PATTERN.test(normalized) ? normalized : null;
}

function normalizeShopierPaymentUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  try {
    const url = new URL(normalized);

    if (
      url.protocol === "https:" &&
      (url.hostname === "www.shopier.com" || url.hostname === "shopier.com")
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeIsoTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const timestamp = Date.parse(normalized);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function formatStoryOfUsEmailDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
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
