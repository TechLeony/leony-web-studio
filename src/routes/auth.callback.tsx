import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createInvitationClient } from "@/integrations/supabase/invitation-client";
import { SITE } from "@/lib/site";
import {
  ADMIN_INVITATION_PATH,
  acceptAdminInvitation,
  readAdminInvitation,
  setInvitedAdminPassword,
} from "@/lib/adminInvitation";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Activate admin account | LEONY" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: AdminInvitation,
});

function AdminInvitation() {
  const flow = useRef<{
    client: ReturnType<typeof createInvitationClient>;
    acceptance: Promise<string>;
    revoked: boolean;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Keep one acceptance operation across React StrictMode effect replays.
    if (!flow.current) {
      const input = readAdminInvitation(window.location);
      window.history.replaceState(null, "", ADMIN_INVITATION_PATH);
      try {
        const client = createInvitationClient();
        flow.current = {
          client,
          acceptance: acceptAdminInvitation(client, input, SITE.adminEmail),
          revoked: false,
        };
      } catch {
        setStatus("invalid");
        return;
      }
    }
    const { client, acceptance } = flow.current;
    const { data } = client.auth.onAuthStateChange((event) => {
      if (active && event === "SIGNED_OUT") {
        if (flow.current) flow.current.revoked = true;
        setUserId(null);
        setStatus("invalid");
      }
    });
    void acceptance
      .then((id) => {
        if (active && !flow.current?.revoked) {
          setUserId(id);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setUserId(null);
          setStatus("invalid");
          void client.auth.signOut({ scope: "local" }).catch(() => {});
        }
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || status !== "ready" || !flow.current) return;
    setBusy(true);
    setError(null);
    try {
      await setInvitedAdminPassword(
        flow.current.client,
        userId,
        SITE.adminEmail,
        password,
        confirmation,
      );
      setPassword("");
      setConfirmation("");
      setUserId(null);
      const { error: signOutError } = await flow.current.client.auth
        .signOut({ scope: "local" })
        .catch(() => ({ error: true }));
      setStatus("done");
      if (signOutError)
        setError("Password set, but sign-out failed. Close this tab and sign in again.");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Account activation could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm py-8">
        <h1 className="text-xl font-semibold">LEONY admin activation</h1>
        {status === "checking" && (
          <p role="status" className="mt-4">
            Checking invitation...
          </p>
        )}
        {status === "invalid" && (
          <p role="alert" className="mt-4">
            This invitation is invalid, expired, or not authorized. Contact the project owner.
          </p>
        )}
        {status === "done" && (
          <p role="status" className="mt-4">
            Password set. Sign in with your new password.
          </p>
        )}
        {status === "ready" && (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm">
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3"
              />
            </label>
            <button
              disabled={busy}
              className="h-11 rounded-md bg-navy text-navy-foreground disabled:opacity-60"
            >
              {busy ? "Activating..." : "Set password"}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <a href="/admin" className="mt-6 inline-block text-sm underline">
          Back to admin login
        </a>
      </div>
    </main>
  );
}
