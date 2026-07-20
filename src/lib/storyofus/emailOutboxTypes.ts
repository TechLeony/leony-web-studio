export type StoryOfUsEmailType =
  "checkout_created" | "order_created" | "setup_submitted" | "final_site_ready";

export const storyOfUsEmailTypeValues = [
  "checkout_created",
  "order_created",
  "setup_submitted",
  "final_site_ready",
] as const satisfies readonly StoryOfUsEmailType[];

export const storyOfUsEmailTypes = new Set<StoryOfUsEmailType>(storyOfUsEmailTypeValues);

export function createStoryOfUsEmailEventKey(submissionId: string, emailType: StoryOfUsEmailType) {
  return `storyofus:${emailType}:${submissionId}`;
}
