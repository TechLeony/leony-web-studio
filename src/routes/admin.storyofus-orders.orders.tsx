import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/orders")({
  ssr: false,
  component: StoryOfUsAdminOrdersRoute,
});

function StoryOfUsAdminOrdersRoute() {
  return <StoryOfUsAdminDashboard view="orders" />;
}
