import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders")({
  ssr: false,
  component: StoryOfUsAdminOverviewRoute,
});

function StoryOfUsAdminOverviewRoute() {
  return <StoryOfUsAdminDashboard view="overview" />;
}
