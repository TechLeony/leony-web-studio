import { storyOfUsSupabaseAdmin } from "./supabaseAdmin.server";

export type StoryOfUsEmailType = "order_created" | "final_site_ready";

export type EnqueueStoryOfUsEmailInput = {
  submissionId: string;
  emailType: StoryOfUsEmailType;
};

export type EnqueueStoryOfUsEmailResult =
  | {
      ok: true;
      queued: true;
      outboxId: string;
    }
  | {
      ok: true;
      queued: false;
      reason: "already_queued";
    }
  | {
      ok: false;
      errorCode: "invalid_input" | "database_error";
    };

const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const storyOfUsEmailTypes = new Set<StoryOfUsEmailType>(["order_created", "final_site_ready"]);

export async function enqueueStoryOfUsEmail({
  submissionId,
  emailType,
}: EnqueueStoryOfUsEmailInput): Promise<EnqueueStoryOfUsEmailResult> {
  const normalizedSubmissionId = submissionId.trim();

  if (!UUID_PATTERN.test(normalizedSubmissionId) || !storyOfUsEmailTypes.has(emailType)) {
    return {
      ok: false,
      errorCode: "invalid_input",
    };
  }

  const { data, error } = await storyOfUsSupabaseAdmin
    .from("storyofus_email_outbox")
    .insert({
      submission_id: normalizedSubmissionId,
      email_type: emailType,
      event_key: createStoryOfUsEmailEventKey(normalizedSubmissionId, emailType),
      status: "pending",
    })
    .select("id")
    .single();

  if (!error && data?.id) {
    return {
      ok: true,
      queued: true,
      outboxId: String(data.id),
    };
  }

  if (isUniqueViolation(error)) {
    return {
      ok: true,
      queued: false,
      reason: "already_queued",
    };
  }

  return {
    ok: false,
    errorCode: "database_error",
  };
}

function createStoryOfUsEmailEventKey(submissionId: string, emailType: StoryOfUsEmailType) {
  return `storyofus:${emailType}:${submissionId}`;
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === POSTGRES_UNIQUE_VIOLATION_CODE;
}
