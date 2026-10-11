export const PASSWORD_RECOVERY_PATH = "/auth/reset-password";

export function passwordRecoveryRedirect(origin: string) {
  return new URL(PASSWORD_RECOVERY_PATH, origin).href;
}

export function passwordValidationError(password: string, confirmation: string) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

type RecoveryAuth = {
  getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  updateUser: (attributes: { password: string }) => Promise<{ error: unknown }>;
};

type RecoverySession = { user: { id: string } } | null;
type RecoveryObserverAuth = Pick<RecoveryAuth, "getUser"> & {
  initialize: () => Promise<unknown>;
  onAuthStateChange: (callback: (event: string, session: RecoverySession) => void) => {
    data: { subscription: { unsubscribe: () => void } };
  };
};

export function observePasswordRecovery(
  auth: RecoveryObserverAuth,
  callbacks: { ready: (userId: string) => void; invalid: () => void; scrubUrl: () => void },
) {
  let active = true;
  let recoverySeen = false;
  let generation = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const defer = (callback: () => void) => {
    timers.add(
      setTimeout(() => {
        if (active) callback();
      }, 0),
    );
  };
  const invalidate = () => {
    callbacks.scrubUrl();
    callbacks.invalid();
  };
  const { data } = auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user.id) {
      recoverySeen = true;
      const run = ++generation;
      // Auth methods run outside the SDK notification callback/lock.
      defer(() => {
        void auth
          .getUser()
          .then(({ data: verified, error }) => {
            if (!active || run !== generation) return;
            callbacks.scrubUrl();
            if (error || verified.user?.id !== session.user.id) callbacks.invalid();
            else callbacks.ready(verified.user.id);
          })
          .catch(() => {
            if (active && run === generation) invalidate();
          });
      });
    } else if (event === "SIGNED_OUT") {
      generation++;
      if (active) invalidate();
    }
  });
  void auth
    .initialize()
    .then(() => {
      // The SDK emits PASSWORD_RECOVERY on the next task after initialization.
      if (active)
        defer(() => {
          if (!recoverySeen) invalidate();
        });
    })
    .catch(() => {
      if (active) invalidate();
    });
  return () => {
    active = false;
    for (const timer of timers) clearTimeout(timer);
    data.subscription.unsubscribe();
  };
}

export async function updateRecoveredPassword(
  auth: RecoveryAuth,
  recoveryUserId: string | null,
  password: string,
  confirmation: string,
) {
  if (!recoveryUserId) throw new Error("Open a valid password recovery email first.");
  const validation = passwordValidationError(password, confirmation);
  if (validation) throw new Error(validation);
  const { data, error } = await auth.getUser().catch(() => ({ data: { user: null }, error: true }));
  if (error || !data.user || data.user.id !== recoveryUserId) {
    throw new Error("Your recovery session has expired. Request a new email.");
  }
  const result = await auth.updateUser({ password }).catch(() => ({ error: true }));
  if (result.error) {
    throw new Error(
      "Password could not be updated. Check the password requirements or request a new email.",
    );
  }
}
