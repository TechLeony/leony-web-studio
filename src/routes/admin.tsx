import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Heart,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Leony Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<null | { email: string | null }>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session?.user ? { email: data.session.user.email ?? null } : null);
      setAuthChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession?.user ? { email: nextSession.user.email ?? null } : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authChecking) return <CenterMsg>Loading admin session...</CenterMsg>;
  if (!session) return <AdminLogin />;

  const allowed = session.email?.toLowerCase() === SITE.adminEmail.toLowerCase();

  if (!allowed) {
    return (
      <CenterMsg>
        <p className="font-semibold text-slate-950">
          This account is not authorized for Leony Admin.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Contact the workspace owner if this looks wrong.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Sign out
        </button>
      </CenterMsg>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AdminSidebar email={session.email} className="hidden lg:flex" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            aria-label="Close admin navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <AdminSidebar
            email={session.email}
            className="relative flex h-full w-80 max-w-[86vw]"
            onNavigate={() => setMobileNavOpen(false)}
            closeButton={
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                aria-label="Close admin navigation"
              >
                <X className="h-4 w-4" />
              </button>
            }
          />
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <Outlet />
      </div>
    </div>
  );
}

function AdminSidebar({
  email,
  className,
  closeButton,
  onNavigate,
}: {
  email: string | null;
  className?: string;
  closeButton?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 flex-col border-r border-slate-200 bg-white ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
              <Heart className="h-4 w-4 fill-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">StoryOfUs</p>
              <p className="text-xs text-slate-500">Operations</p>
            </div>
          </div>
          <p className="mt-4 max-w-48 truncate text-xs text-slate-500">{email}</p>
        </div>
        {closeButton}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
          label="Preview Pages"
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

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
      onClick={onNavigate}
    >
      {icon}
      {label}
    </Link>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center text-slate-700">
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      setErr("Unable to sign in with those credentials.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
            <Heart className="h-5 w-5 fill-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage StoryOfUs orders, delivery, refunds, and customer operations.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          {err && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-11 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
