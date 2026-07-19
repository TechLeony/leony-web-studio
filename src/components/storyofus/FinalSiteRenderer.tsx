import { StoryOfUsExperience } from "@/components/storyofus/StoryOfUsExperience";
import { createStoryOfUsExperienceDataFromFinalSite } from "@/components/storyofus/storyOfUsExperienceAdapter";
import type { StoryOfUsFinalSiteData } from "@/lib/storyofus/finalSite.server";

export function StoryOfUsFinalSiteRenderer({
  site,
}: {
  site: StoryOfUsFinalSiteData;
  previewNotice?: string;
}) {
  return (
    <StoryOfUsExperience story={createStoryOfUsExperienceDataFromFinalSite(site)} startEntered />
  );
}
