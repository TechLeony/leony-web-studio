import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Heart,
  Inbox,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

import { StoryOfUsAdminDashboard } from "@/components/storyofus/StoryOfUsAdminDashboard";

export const Route = createFileRoute("/admin/storyofus-orders")({
  ssr: false,
  component: StoryOfUsAdminLayoutRoute,
});

function StoryOfUsAdminLayoutRoute() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isOverviewRoute = pathname.replace(/\/+$/, "") === "/admin/storyofus-orders";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="fixed left-4 top-24 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        aria-label="Open StoryOfUs navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <StoryOfUsSidebar className="hidden lg:flex" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            aria-label="Close StoryOfUs navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <StoryOfUsSidebar
            className="relative flex h-full w-80 max-w-[86vw]"
            onNavigate={() => setMobileNavOpen(false)}
            closeButton={
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                aria-label="Close StoryOfUs navigation"
              >
                <X className="h-4 w-4" />
              </button>
            }
          />
        </div>
      )}

      <div className="min-h-screen lg:pl-[clamp(132px,10vw,172px)]">
        {isOverviewRoute ? <StoryOfUsAdminDashboard view="overview" /> : <Outlet />}
      </div>
    </div>
  );
}

function StoryOfUsSidebar({
  className,
  closeButton,
  onNavigate,
}: {
  className?: string;
  closeButton?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[clamp(132px,10vw,172px)] flex-col border-r border-slate-200 bg-white ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
              <Heart className="h-4 w-4 fill-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">StoryOfUs</p>
              <p className="truncate text-[11px] text-slate-500">Operations</p>
            </div>
          </div>
        </div>
        {closeButton}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        <SidebarLink
          to="/admin"
          label="Back to Admin"
          icon={<ArrowLeft className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
        <div className="my-3 border-t border-slate-100" />
        <SidebarLink
          to="/admin/storyofus-orders"
          label="Overview"
          icon={<LayoutDashboard className="h-4 w-4" />}
          onNavigate={onNavigate}
          exact
        />
        <SidebarLink
          to="/admin/storyofus-orders/orders"
          label="Orders"
          icon={<Inbox className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
        <SidebarLink
          to="/admin/storyofus-orders/previews"
          label="Previews"
          icon={<Heart className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
        <SidebarLink
          to="/admin/storyofus-orders/refunds"
          label="Refunds"
          icon={<ClipboardList className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
        <SidebarLink
          to="/admin/storyofus-orders/analytics"
          label="Analytics"
          icon={<BarChart3 className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
        <SidebarLink
          to="/admin/storyofus-orders/settings"
          label="Settings"
          icon={<Settings className="h-4 w-4" />}
          onNavigate={onNavigate}
        />
      </nav>
    </aside>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  exact,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      activeProps={{ className: "bg-blue-50 text-blue-700" }}
      inactiveProps={{ className: "text-slate-600 hover:bg-slate-100 hover:text-slate-950" }}
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition"
      onClick={onNavigate}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
