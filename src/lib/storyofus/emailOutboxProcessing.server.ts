import type { StoryOfUsEmailType } from "./emailOutbox.server";
import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type StoryOfUsEmailOutboxStatus =
  "pending" | "processing" | "retry_scheduled" | "sent" | "dead";

const storyOfUsEmailFailureCategories = [
  "invalid_input",
  "missing_configuration",
  "rate_limited",
  "provider_rejected",
  "provider_unavailable",
  "provider_error",
] as const;

export type StoryOfUsEmailFailureCategory = (typeof storyOfUsEmailFailureCategories)[number];

export type StoryOfUsClaimedEmailOutboxRow = {
  id: string;
  submissionId: string;
  emailType: StoryOfUsEmailType;
  eventKey: string;
  status: "processing";
  attemptCount: number;
  lockedAt: string;
  lockToken: string;
  queuedAt: string;
  createdAt: string;
};

export type StoryOfUsClaimEmailOutboxBatchInput = {
  batchSize?: number;
};

export type StoryOfUsEmailAttemptSuccessOutcome = {
  ok: true;
  providerMessageId: string;
};

export type StoryOfUsEmailAttemptFailureOutcome = {
  ok: false;
  errorCode: StoryOfUsEmailFailureCategory;
  retryAfterSeconds?: number;
};

export type StoryOfUsEmailAttemptOutcome =
  StoryOfUsEmailAttemptSuccessOutcome | StoryOfUsEmailAttemptFailureOutcome;

export type StoryOfUsRetryDecision =
  | {
      action: "retry";
      errorCode: StoryOfUsEmailFailureCategory;
      nextAttemptAt: string;
      retryDelaySeconds: number;
    }
  | {
      action: "dead";
      errorCode: StoryOfUsEmailFailureCategory;
    };

export type StoryOfUsCompleteEmailAttemptResult =
  | {
      ok: true;
      transition: "sent";
    }
  | {
      ok: true;
      transition: "retry_scheduled";
      nextAttemptAt: string;
    }
  | {
      ok: true;
      transition: "dead";
    }
  | {
      ok: false;
      reason: "lock_lost";
    };

type StoryOfUsRpcClaimedOutboxRow = {
  id?: unknown;
  submission_id?: unknown;
  email_type?: unknown;
  event_key?: unknown;
  status?: unknown;
  attempt_count?: unknown;
  locked_at?: unknown;
  lock_token?: unknown;
  queued_at?: unknown;
  created_at?: unknown;
};

type StoryOfUsCompletionRpcName =
  | "storyofus_mark_email_outbox_sent"
  | "storyofus_schedule_email_outbox_retry"
  | "storyofus_mark_email_outbox_dead";

const MAX_CLAIM_BATCH_SIZE = 25;
const DEFAULT_CLAIM_BATCH_SIZE = 10;
const MAX_ATTEMPTS = 8;
const MAX_RETRY_AFTER_SECONDS = 86_400;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_PROVIDER_MESSAGE_ID_PATTERN = /^[a-zA-Z0-9:._@-]+$/;
const storyOfUsEmailTypes = new Set<StoryOfUsEmailType>(["order_created", "final_site_ready"]);
const storyOfUsEmailStatuses = new Set<StoryOfUsEmailOutboxStatus>([
  "pending",
  "processing",
  "retry_scheduled",
  "sent",
  "dead",
]);
const storyOfUsEmailFailureCategorySet = new Set<StoryOfUsEmailFailureCategory>(
  storyOfUsEmailFailureCategories,
);
const retryableEmailFailureCategories = [
  "rate_limited",
  "provider_unavailable",
  "provider_error",
] as const satisfies readonly StoryOfUsEmailFailureCategory[];
const permanentEmailFailureCategories = [
  "invalid_input",
  "missing_configuration",
  "provider_rejected",
] as const satisfies readonly StoryOfUsEmailFailureCategory[];
const retryableEmailFailureCategorySet = new Set<StoryOfUsEmailFailureCategory>(
  retryableEmailFailureCategories,
);
const permanentEmailFailureCategorySet = new Set<StoryOfUsEmailFailureCategory>(
  permanentEmailFailureCategories,
);
const retryDelaysByFailedAttempt = Object.freeze({
  1: 60,
  2: 300,
  3: 900,
  4: 3_600,
  5: 10_800,
  6: 21_600,
  7: 43_200,
} satisfies Readonly<Record<number, number>>);

export async function claimStoryOfUsEmailOutboxBatch({
  batchSize = DEFAULT_CLAIM_BATCH_SIZE,
}: StoryOfUsClaimEmailOutboxBatchInput = {}): Promise<StoryOfUsClaimedEmailOutboxRow[]> {
  const safeBatchSize = normalizeBatchSize(batchSize);
  const { data, error } = await storyOfUsSupabaseAdmin.rpc("storyofus_claim_email_outbox_batch", {
    p_batch_size: safeBatchSize,
  });

  if (error) {
    throw new Error("StoryOfUs email outbox batch could not be claimed.");
  }

  if (!Array.isArray(data)) {
    throw new Error("StoryOfUs email outbox claim returned an invalid response.");
  }

  if (data.length > safeBatchSize) {
    throw new Error("StoryOfUs email outbox claim returned an invalid response.");
  }

  const claimedRows = data.map((row) => parseClaimedOutboxRow(row));
  validateClaimedOutboxBatch(claimedRows);

  return claimedRows;
}

export function calculateStoryOfUsRetryDecision({
  attemptCount,
  errorCode,
  retryAfterSeconds,
  now = new Date(),
}: {
  attemptCount: number;
  errorCode: StoryOfUsEmailFailureCategory;
  retryAfterSeconds?: number;
  now?: Date;
}): StoryOfUsRetryDecision {
  if (
    !isStoryOfUsEmailFailureCategory(errorCode) ||
    !isPositiveInteger(attemptCount) ||
    attemptCount > MAX_ATTEMPTS ||
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("StoryOfUs email retry decision input is invalid.");
  }

  const nowTimestamp = now.getTime();

  if (permanentEmailFailureCategorySet.has(errorCode) || attemptCount >= MAX_ATTEMPTS) {
    return {
      action: "dead",
      errorCode,
    };
  }

  if (!retryableEmailFailureCategorySet.has(errorCode)) {
    return {
      action: "dead",
      errorCode,
    };
  }

  const baseRetryDelaySeconds = retryDelaysByFailedAttempt[attemptCount];

  if (!baseRetryDelaySeconds) {
    return {
      action: "dead",
      errorCode,
    };
  }

  const normalizedRetryAfterSeconds = normalizeRetryAfterSeconds(retryAfterSeconds);
  const retryDelaySeconds = Math.max(baseRetryDelaySeconds, normalizedRetryAfterSeconds ?? 0);
  const nextAttemptTimestamp = nowTimestamp + retryDelaySeconds * 1000;

  if (!Number.isFinite(nextAttemptTimestamp)) {
    throw new Error("StoryOfUs email retry decision input is invalid.");
  }

  const nextAttemptDate = new Date(nextAttemptTimestamp);

  if (!Number.isFinite(nextAttemptDate.getTime())) {
    throw new Error("StoryOfUs email retry decision input is invalid.");
  }

  const nextAttemptAt = nextAttemptDate.toISOString();

  return {
    action: "retry",
    errorCode,
    nextAttemptAt,
    retryDelaySeconds,
  };
}

export async function completeStoryOfUsEmailAttempt(input: {
  claimed: Pick<StoryOfUsClaimedEmailOutboxRow, "id" | "lockToken" | "attemptCount">;
  outcome: StoryOfUsEmailAttemptOutcome;
}): Promise<StoryOfUsCompleteEmailAttemptResult> {
  const { claimed, outcome } = parseCompleteEmailAttemptInput(input);

  if (outcome.ok) {
    return markStoryOfUsEmailOutboxSent({
      outboxId: claimed.id,
      lockToken: claimed.lockToken,
      providerMessageId: outcome.providerMessageId,
    });
  }

  if (!isStoryOfUsEmailFailureCategory(outcome.errorCode)) {
    throw new Error("StoryOfUs email outbox completion category is invalid.");
  }

  const decision = calculateStoryOfUsRetryDecision({
    attemptCount: claimed.attemptCount,
    errorCode: outcome.errorCode,
    retryAfterSeconds: outcome.retryAfterSeconds,
  });

  if (decision.action === "retry") {
    return scheduleStoryOfUsEmailOutboxRetry({
      outboxId: claimed.id,
      lockToken: claimed.lockToken,
      nextAttemptAt: decision.nextAttemptAt,
      errorCode: decision.errorCode,
    });
  }

  return markStoryOfUsEmailOutboxDead({
    outboxId: claimed.id,
    lockToken: claimed.lockToken,
    errorCode: decision.errorCode,
  });
}

async function markStoryOfUsEmailOutboxSent({
  outboxId,
  lockToken,
  providerMessageId,
}: {
  outboxId: string;
  lockToken: string;
  providerMessageId: string;
}): Promise<StoryOfUsCompleteEmailAttemptResult> {
  if (typeof providerMessageId !== "string") {
    throw new Error("StoryOfUs email provider message id is invalid.");
  }

  const normalizedProviderMessageId = providerMessageId.trim();

  if (
    !normalizedProviderMessageId ||
    normalizedProviderMessageId.length > 160 ||
    !SAFE_PROVIDER_MESSAGE_ID_PATTERN.test(normalizedProviderMessageId)
  ) {
    throw new Error("StoryOfUs email provider message id is invalid.");
  }

  const applied = await callBooleanOutboxRpc("storyofus_mark_email_outbox_sent", {
    p_outbox_id: outboxId,
    p_lock_token: lockToken,
    p_provider_message_id: normalizedProviderMessageId,
  });

  if (!applied) {
    return {
      ok: false,
      reason: "lock_lost",
    };
  }

  return {
    ok: true,
    transition: "sent",
  };
}

async function scheduleStoryOfUsEmailOutboxRetry({
  outboxId,
  lockToken,
  nextAttemptAt,
  errorCode,
}: {
  outboxId: string;
  lockToken: string;
  nextAttemptAt: string;
  errorCode: StoryOfUsEmailFailureCategory;
}): Promise<StoryOfUsCompleteEmailAttemptResult> {
  if (!isFutureIsoTimestamp(nextAttemptAt) || !isRetryableFailureCategory(errorCode)) {
    throw new Error("StoryOfUs email retry request is invalid.");
  }

  const applied = await callBooleanOutboxRpc("storyofus_schedule_email_outbox_retry", {
    p_outbox_id: outboxId,
    p_lock_token: lockToken,
    p_next_attempt_at: nextAttemptAt,
    p_error_code: errorCode,
  });

  if (!applied) {
    return {
      ok: false,
      reason: "lock_lost",
    };
  }

  return {
    ok: true,
    transition: "retry_scheduled",
    nextAttemptAt,
  };
}

async function markStoryOfUsEmailOutboxDead({
  outboxId,
  lockToken,
  errorCode,
}: {
  outboxId: string;
  lockToken: string;
  errorCode: StoryOfUsEmailFailureCategory;
}): Promise<StoryOfUsCompleteEmailAttemptResult> {
  if (!isStoryOfUsEmailFailureCategory(errorCode)) {
    throw new Error("StoryOfUs email terminal request is invalid.");
  }

  const applied = await callBooleanOutboxRpc("storyofus_mark_email_outbox_dead", {
    p_outbox_id: outboxId,
    p_lock_token: lockToken,
    p_error_code: errorCode,
  });

  if (!applied) {
    return {
      ok: false,
      reason: "lock_lost",
    };
  }

  return {
    ok: true,
    transition: "dead",
  };
}

async function callBooleanOutboxRpc(
  functionName: StoryOfUsCompletionRpcName,
  args: Record<string, string>,
) {
  const { data, error } = await storyOfUsSupabaseAdmin.rpc(functionName, args);

  if (error) {
    throw new Error("StoryOfUs email outbox transition could not be applied.");
  }

  if (typeof data !== "boolean") {
    throw new Error("StoryOfUs email outbox transition returned an invalid response.");
  }

  return data;
}

function parseClaimedOutboxRow(row: unknown): StoryOfUsClaimedEmailOutboxRow {
  if (!row || typeof row !== "object") {
    throw new Error("StoryOfUs email outbox claim row is invalid.");
  }

  const rpcRow = row as StoryOfUsRpcClaimedOutboxRow;
  const id = parseUuid(rpcRow.id);
  const submissionId = parseUuid(rpcRow.submission_id);
  const emailType = parseEmailType(rpcRow.email_type);
  const eventKey = parseEventKey(rpcRow.event_key, emailType, submissionId);
  const status = parseClaimedStatus(rpcRow.status);
  const attemptCount = parseAttemptCount(rpcRow.attempt_count);
  const lockedAt = parseIsoTimestamp(rpcRow.locked_at);
  const lockToken = parseUuid(rpcRow.lock_token);
  const queuedAt = parseIsoTimestamp(rpcRow.queued_at);
  const createdAt = parseIsoTimestamp(rpcRow.created_at);

  return {
    id,
    submissionId,
    emailType,
    eventKey,
    status,
    attemptCount,
    lockedAt,
    lockToken,
    queuedAt,
    createdAt,
  };
}

function validateClaimedOutboxBatch(rows: StoryOfUsClaimedEmailOutboxRow[]) {
  const claimedIds = new Set<string>();
  const claimedEventKeys = new Set<string>();
  const claimedLockTokens = new Set<string>();

  for (const row of rows) {
    if (
      claimedIds.has(row.id) ||
      claimedEventKeys.has(row.eventKey) ||
      claimedLockTokens.has(row.lockToken)
    ) {
      throw new Error("StoryOfUs email outbox claim returned an invalid response.");
    }

    claimedIds.add(row.id);
    claimedEventKeys.add(row.eventKey);
    claimedLockTokens.add(row.lockToken);
  }
}

function parseCompleteEmailAttemptInput(input: unknown): {
  claimed: Pick<StoryOfUsClaimedEmailOutboxRow, "id" | "lockToken" | "attemptCount">;
  outcome: StoryOfUsEmailAttemptOutcome;
} {
  if (!isNonArrayObject(input)) {
    throw new Error("StoryOfUs email outbox completion request is invalid.");
  }

  const claimed = parseCompletionClaimed(input.claimed);
  const outcome = parseCompletionOutcome(input.outcome);

  return {
    claimed,
    outcome,
  };
}

function parseCompletionClaimed(
  value: unknown,
): Pick<StoryOfUsClaimedEmailOutboxRow, "id" | "lockToken" | "attemptCount"> {
  if (!isNonArrayObject(value)) {
    throw new Error("StoryOfUs email outbox completion identity is invalid.");
  }

  const id = value.id;
  const lockToken = value.lockToken;
  const attemptCount = value.attemptCount;

  if (
    typeof id !== "string" ||
    typeof lockToken !== "string" ||
    !UUID_PATTERN.test(id) ||
    !UUID_PATTERN.test(lockToken)
  ) {
    throw new Error("StoryOfUs email outbox completion identity is invalid.");
  }

  if (
    typeof attemptCount !== "number" ||
    !isPositiveInteger(attemptCount) ||
    attemptCount > MAX_ATTEMPTS
  ) {
    throw new Error("StoryOfUs email outbox completion attempt is invalid.");
  }

  return {
    id,
    lockToken,
    attemptCount,
  };
}

function parseCompletionOutcome(value: unknown): StoryOfUsEmailAttemptOutcome {
  if (!isNonArrayObject(value) || typeof value.ok !== "boolean") {
    throw new Error("StoryOfUs email outbox completion outcome is invalid.");
  }

  if (value.ok === true) {
    if (typeof value.providerMessageId !== "string") {
      throw new Error("StoryOfUs email provider message id is invalid.");
    }

    return {
      ok: true,
      providerMessageId: value.providerMessageId,
    };
  }

  if (!isStoryOfUsEmailFailureCategory(value.errorCode)) {
    throw new Error("StoryOfUs email outbox completion category is invalid.");
  }

  return {
    ok: false,
    errorCode: value.errorCode,
    retryAfterSeconds:
      typeof value.retryAfterSeconds === "number" ? value.retryAfterSeconds : undefined,
  };
}

function normalizeBatchSize(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_CLAIM_BATCH_SIZE;
  }

  return Math.min(Math.max(Math.trunc(value), 1), MAX_CLAIM_BATCH_SIZE);
}

function normalizeRetryAfterSeconds(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.min(Math.ceil(value), MAX_RETRY_AFTER_SECONDS);
}

function parseUuid(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error("StoryOfUs email outbox UUID is invalid.");
  }

  return value;
}

function parseEmailType(value: unknown): StoryOfUsEmailType {
  if (typeof value !== "string" || !storyOfUsEmailTypes.has(value as StoryOfUsEmailType)) {
    throw new Error("StoryOfUs email outbox email type is invalid.");
  }

  return value as StoryOfUsEmailType;
}

function parseEventKey(value: unknown, emailType: StoryOfUsEmailType, submissionId: string) {
  const expectedEventKey = `storyofus:${emailType}:${submissionId}`;

  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 256 ||
    value !== expectedEventKey
  ) {
    throw new Error("StoryOfUs email outbox event key is invalid.");
  }

  return value;
}

function parseAttemptCount(value: unknown) {
  if (typeof value !== "number" || !isPositiveInteger(value) || value > MAX_ATTEMPTS) {
    throw new Error("StoryOfUs email outbox attempt count is invalid.");
  }

  return value;
}

function parseIsoTimestamp(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("StoryOfUs email outbox timestamp is invalid.");
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error("StoryOfUs email outbox timestamp is invalid.");
  }

  return new Date(timestamp).toISOString();
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isNonArrayObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFutureIsoTimestamp(value: string) {
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function isStoryOfUsEmailFailureCategory(value: unknown): value is StoryOfUsEmailFailureCategory {
  return (
    typeof value === "string" &&
    storyOfUsEmailFailureCategorySet.has(value as StoryOfUsEmailFailureCategory)
  );
}

function isRetryableFailureCategory(
  value: unknown,
): value is (typeof retryableEmailFailureCategories)[number] {
  return (
    typeof value === "string" &&
    retryableEmailFailureCategorySet.has(value as StoryOfUsEmailFailureCategory)
  );
}

function parseClaimedStatus(value: unknown): "processing" {
  if (!isKnownOutboxStatus(value) || value !== "processing") {
    throw new Error("StoryOfUs email outbox claimed status is invalid.");
  }

  return value;
}

function isKnownOutboxStatus(value: unknown): value is StoryOfUsEmailOutboxStatus {
  return (
    typeof value === "string" && storyOfUsEmailStatuses.has(value as StoryOfUsEmailOutboxStatus)
  );
}
