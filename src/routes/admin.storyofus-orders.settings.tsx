import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/settings")({
  ssr: false,
  component: StoryOfUsAdminSettingsRoute,
});

function StoryOfUsAdminSettingsRoute() {
  return <StoryOfUsAdminDashboard view="settings" />;
}
