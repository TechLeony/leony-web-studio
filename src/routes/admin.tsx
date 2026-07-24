import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";
import { LogOut, Inbox, ClipboardList, Heart } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Leony Admin Panel" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<null | { email: string | null }>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session?.user ? { email: data.session.user.email ?? null } : null);
      setAuthChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s?.user ? { email: s.user.email ?? null } : null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authChecking) return <CenterMsg>Yükleniyor...</CenterMsg>;
  if (!session) return <AdminLogin />;

  const allowed = session.email?.toLowerCase() === SITE.adminEmail.toLowerCase();
  if (!allowed) {
    return (
      <CenterMsg>
        <p className="text-foreground font-semibold">
          Bu hesap admin paneline erişim yetkisine sahip değil.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Yetkili admin: {SITE.adminEmail}</p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-navy text-navy-foreground px-4 text-sm font-semibold cursor-pointer"
        >
          Çıkış yap
        </button>
      </CenterMsg>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Leony Admin Panel</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{session.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <NavTab to="/admin" icon={<Inbox className="h-3.5 w-3.5" />} label="Leadler" exact />
              <NavTab
                to="/admin/tasks"
                icon={<ClipboardList className="h-3.5 w-3.5" />}
                label="Tasklar"
              />
              <NavTab
                to="/admin/storyofus-orders"
                icon={<Heart className="h-3.5 w-3.5" />}
                label="Story of Us"
              />
            </nav>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 h-9 rounded-full border border-border bg-card px-3 text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Çıkış
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function NavTab({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      activeProps={{ className: "bg-navy text-navy-foreground" }}
      inactiveProps={{ className: "text-foreground hover:bg-muted" }}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors"
    >
      {icon} {label}
    </Link>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Leony Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Yönetici girişi gerekli.</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Şifre</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 h-11 rounded-full bg-navy text-navy-foreground text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
