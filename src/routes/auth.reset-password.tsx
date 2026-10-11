import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PASSWORD_RECOVERY_PATH,
  observePasswordRecovery,
  updateRecoveredPassword,
} from "@/lib/passwordRecovery";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password | LEONY" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PasswordRecovery,
});

function PasswordRecovery() {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return observePasswordRecovery(supabase.auth, {
      scrubUrl: () => window.history.replaceState(null, "", PASSWORD_RECOVERY_PATH),
      ready: (id) => {
        setUserId(id);
        setStatus("ready");
      },
      invalid: () => {
        setUserId(null);
        setStatus("invalid");
      },
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || status !== "ready") return;
    setBusy(true);
    setError(null);
    try {
      await updateRecoveredPassword(supabase.auth, userId, password, confirmation);
      setPassword("");
      setConfirmation("");
      setUserId(null);
      await supabase.auth.signOut({ scope: "local" });
      setStatus("done");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Password could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm py-8">
        <h1 className="text-xl font-semibold">LEONY password recovery</h1>
        {status === "checking" && (
          <p role="status" className="mt-4">
            Checking recovery link...
          </p>
        )}
        {status === "invalid" && (
          <p role="alert" className="mt-4">
            This recovery link is invalid or expired. Request a new email from the admin login.
          </p>
        )}
        {status === "done" && (
          <p role="status" className="mt-4">
            Password updated. Sign in with your new password.
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
                onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => setConfirmation(e.target.value)}
                className="h-11 rounded-md border border-border bg-background px-3"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="h-11 rounded-md bg-navy text-navy-foreground disabled:opacity-60"
            >
              {busy ? "Updating..." : "Set new password"}
            </button>
          </form>
        )}
        <a href="/admin" className="mt-6 inline-block text-sm underline">
          Back to admin login
        </a>
      </div>
    </main>
  );
}
