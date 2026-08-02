import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAdminTabVerification,
  clearCopiedAdminTabVerification,
  getCurrentNavigationType,
  readAdminTabVerification,
  writeAdminTabVerification,
} from "@/lib/adminTabVerification";
import { verifyAdminTabAccess } from "@/lib/adminTabVerification.server";
import { LogOut, Inbox, ClipboardList, Heart } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Leony Admin Panel" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<null | AdminSession>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [tabVerified, setTabVerified] = useState(false);
  const verifyTabAccess = useServerFn(verifyAdminTabAccess);

  useEffect(() => {
    let mounted = true;
    let verificationRun = 0;
    let currentUserId: string | null = null;

    clearCopiedAdminTabVerification({
      storage: window.sessionStorage,
      navigationType: getCurrentNavigationType(),
    });

    async function applySession(nextSession: AdminSession | null) {
      const run = ++verificationRun;
      const userChanged = Boolean(nextSession && currentUserId && nextSession.id !== currentUserId);
      currentUserId = nextSession?.id ?? null;

      if (!mounted) return;
      setSession(nextSession);

      if (!nextSession) {
        clearAdminTabVerification(window.sessionStorage);
        setAdminAllowed(false);
        setTabVerified(false);
        setAuthChecking(false);
        return;
      }

      if (userChanged) {
        clearAdminTabVerification(window.sessionStorage);
        setAdminAllowed(false);
        setTabVerified(false);
      }

      try {
        const verification = await verifyTabAccess();
        if (!mounted || run !== verificationRun) return;

        setAdminAllowed(verification.allowed);
        if (verification.allowed) {
          if (readAdminTabVerification(window.sessionStorage)) {
            setTabVerified(true);
          } else {
            setTabVerified(false);
          }
        } else {
          clearAdminTabVerification(window.sessionStorage);
          setAdminAllowed(false);
          setTabVerified(false);
        }
      } catch {
        if (!mounted || run !== verificationRun) return;
        clearAdminTabVerification(window.sessionStorage);
        setAdminAllowed(false);
        setTabVerified(false);
      }

      setAuthChecking(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(toAdminSession(data.session));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        clearAdminTabVerification(window.sessionStorage);
        setAdminAllowed(false);
        setTabVerified(false);
        setSession(null);
        setAuthChecking(false);
        currentUserId = null;
        verificationRun++;
        return;
      }

      void applySession(toAdminSession(s));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authChecking) return <CenterMsg>Yükleniyor...</CenterMsg>;
  if (!session) {
    return (
      <AdminLogin
        mode="login"
        onVerified={() => {
          setAdminAllowed(true);
          setTabVerified(true);
        }}
      />
    );
  }

  if (!adminAllowed) {
    return (
      <CenterMsg>
        <p className="text-foreground font-semibold">
          Bu hesap admin paneline erişim yetkisine sahip değil.
        </p>
        <button
          type="button"
          onClick={() => signOutAdminTab()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-navy text-navy-foreground px-4 text-sm font-semibold cursor-pointer"
        >
          Çıkış yap
        </button>
      </CenterMsg>
    );
  }

  if (!tabVerified) {
    return (
      <AdminLogin
        mode="reauth"
        email={session.email ?? ""}
        onVerified={() => {
          setAdminAllowed(true);
          setTabVerified(true);
        }}
      />
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
              onClick={() => signOutAdminTab()}
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

type AdminSession = {
  id: string;
  email: string | null;
};

type SupabaseAuthSession = {
  user?: {
    id?: string;
    email?: string | null;
  } | null;
} | null;

function toAdminSession(session: SupabaseAuthSession): AdminSession | null {
  const userId = session?.user?.id;
  if (!userId) return null;
  return {
    id: userId,
    email: session.user?.email ?? null,
  };
}

async function signOutAdminTab() {
  clearAdminTabVerification(window.sessionStorage);
  await supabase.auth.signOut();
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

function AdminLogin({
  mode,
  email: initialEmail = "",
  onVerified,
}: {
  mode: "login" | "reauth";
  email?: string;
  onVerified: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const verifyTabAccess = useServerFn(verifyAdminTabAccess);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }

    try {
      const verification = await verifyTabAccess();
      if (!verification.allowed) {
        clearAdminTabVerification(window.sessionStorage);
        setErr("Bu hesap admin paneline erişim yetkisine sahip değil.");
        return;
      }

      writeAdminTabVerification(window.sessionStorage);
      onVerified();
      setPassword("");
    } catch (verificationError) {
      clearAdminTabVerification(window.sessionStorage);
      setErr(
        verificationError instanceof Error
          ? verificationError.message
          : "Admin doğrulaması tamamlanamadı.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Leony Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "reauth"
            ? "Bu sekme için yönetici doğrulaması gerekli."
            : "Yönetici girişi gerekli."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <label className="block">
            <span className="block text-xs font-semibold mb-1">Email</span>
            <input
              type="email"
              required
              readOnly={mode === "reauth"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm read-only:bg-muted read-only:text-muted-foreground"
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
