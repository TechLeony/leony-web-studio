export type StoryOfUsEmailType =
  "checkout_created" | "order_created" | "setup_submitted" | "final_site_ready";

export const storyOfUsEmailTypeValues = [
  "checkout_created",
  "order_created",
  "setup_submitted",
  "final_site_ready",
] as const satisfies readonly StoryOfUsEmailType[];

export const storyOfUsEmailTypes = new Set<StoryOfUsEmailType>(storyOfUsEmailTypeValues);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createStoryOfUsEmailEventKey(submissionId: string, emailType: StoryOfUsEmailType) {
  return `storyofus:${emailType}:${submissionId}`;
}

export function isValidStoryOfUsEmailEventKey({
  eventKey,
  emailType,
  submissionId,
}: {
  eventKey: string;
  emailType: StoryOfUsEmailType;
  submissionId: string;
}) {
  const normalizedSubmissionId = submissionId.trim().toLowerCase();

  if (!UUID_PATTERN.test(normalizedSubmissionId)) {
    return false;
  }

  const parts = eventKey.split(":");

  if (
    parts.length === 3 &&
    parts[0] === "storyofus" &&
    parts[1] === emailType &&
    parts[2]?.toLowerCase() === normalizedSubmissionId
  ) {
    return true;
  }

  return (
    emailType === "checkout_created" &&
    parts.length === 4 &&
    parts[0] === "storyofus" &&
    parts[1] === "checkout_created" &&
    parts[2] === "delayed" &&
    parts[3]?.toLowerCase() === normalizedSubmissionId &&
    UUID_PATTERN.test(parts[3])
  );
}
