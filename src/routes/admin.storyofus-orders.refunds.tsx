import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/refunds")({
  ssr: false,
  component: StoryOfUsAdminRefundsRoute,
});

function StoryOfUsAdminRefundsRoute() {
  return <StoryOfUsAdminDashboard view="refunds" />;
}
