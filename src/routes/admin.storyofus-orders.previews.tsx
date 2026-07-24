import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/previews")({
  ssr: false,
  component: StoryOfUsAdminPreviewsRoute,
});

function StoryOfUsAdminPreviewsRoute() {
  return <StoryOfUsAdminDashboard view="previews" />;
}
