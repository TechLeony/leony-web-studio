export const STORYOFUS_DEMO_PASSCODE_UI_VERSION = "demo_v1" as const;

export type StoryOfUsFinalSitePasscodeUiVersion =
  "legacy" | typeof STORYOFUS_DEMO_PASSCODE_UI_VERSION;

export function resolveStoryOfUsFinalSitePasscodeUiVersion(
  value: unknown,
): StoryOfUsFinalSitePasscodeUiVersion {
  return value === STORYOFUS_DEMO_PASSCODE_UI_VERSION
    ? STORYOFUS_DEMO_PASSCODE_UI_VERSION
    : "legacy";
}
