import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsExperience } from "@/components/storyofus/StoryOfUsExperience";
import { demoStoryData } from "@/components/storyofus/storyOfUsExperienceData";

export const Route = createFileRoute("/storyofus/demo")({
  head: () => ({
    meta: [
      { title: "Arda & Ceren — Bizim Hikayemiz | StoryOfUs" },
      {
        name: "description",
        content: "Arda ve Ceren için hazırlanmış özel bir StoryOfUs demo sayfası.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryDemo,
});

function StoryDemo() {
  return <StoryOfUsExperience story={demoStoryData} showDemoDisclaimer />;
}
