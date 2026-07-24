import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders/orders")({
  ssr: false,
  component: StoryOfUsAdminOrdersRoute,
});

function StoryOfUsAdminOrdersRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isOrdersRoute = pathname.replace(/\/+$/, "") === "/admin/storyofus-orders/orders";

  return isOrdersRoute ? <StoryOfUsAdminDashboard view="orders" /> : <Outlet />;
}
