import { createFileRoute } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/orders/$orderId")({
  ssr: false,
  component: StoryOfUsAdminOrderDetailRoute,
});

function StoryOfUsAdminOrderDetailRoute() {
  const { orderId } = Route.useParams();

  return <StoryOfUsAdminDashboard view="detail" orderId={orderId} />;
}
