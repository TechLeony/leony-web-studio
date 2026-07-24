import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/analytics")({
  ssr: false,
  component: StoryOfUsAdminAnalyticsRoute,
});

function StoryOfUsAdminAnalyticsRoute() {
  return <StoryOfUsAdminDashboard view="analytics" />;
}
