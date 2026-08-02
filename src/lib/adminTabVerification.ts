export const ADMIN_TAB_VERIFICATION_KEY = "leony.admin.tabVerification";
export const ADMIN_TAB_VERIFICATION_MARKER = "v1:verified";

export type AdminTabVerificationContext = {
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => {
          eq: (
            column: string,
            value: string,
          ) => {
            maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      };
    };
  };
  userId: string;
  claims: {
    email?: unknown;
  };
};

export type VerifyAdminTabAccessResult =
  | {
      allowed: true;
      email: string;
    }
  | {
      allowed: false;
      reason: "not_admin" | "unauthenticated";
    };

export function readAdminTabVerification(storage: Pick<Storage, "getItem"> | null) {
  if (!storage) {
    return false;
  }

  return storage.getItem(ADMIN_TAB_VERIFICATION_KEY) === ADMIN_TAB_VERIFICATION_MARKER;
}

export function writeAdminTabVerification(storage: Pick<Storage, "setItem"> | null) {
  storage?.setItem(ADMIN_TAB_VERIFICATION_KEY, ADMIN_TAB_VERIFICATION_MARKER);
}

export function clearAdminTabVerification(storage: Pick<Storage, "removeItem"> | null) {
  storage?.removeItem(ADMIN_TAB_VERIFICATION_KEY);
}

export function clearCopiedAdminTabVerification({
  storage,
  navigationType,
}: {
  storage: Pick<Storage, "removeItem"> | null;
  navigationType: PerformanceNavigationTiming["type"] | "";
}) {
  if (navigationType !== "reload") {
    clearAdminTabVerification(storage);
  }
}

export function getCurrentNavigationType() {
  if (typeof window === "undefined") {
    return "";
  }

  const navigationEntry = window.performance.getEntriesByType("navigation")[0];

  if (navigationEntry?.entryType === "navigation") {
    return (navigationEntry as PerformanceNavigationTiming).type;
  }

  const legacyNavigation = window.performance.navigation;

  if (legacyNavigation?.type === legacyNavigation.TYPE_RELOAD) {
    return "reload";
  }

  if (legacyNavigation?.type === legacyNavigation.TYPE_BACK_FORWARD) {
    return "back_forward";
  }

  return "navigate";
}

export async function verifyAdminTabAccessForContext(
  context: AdminTabVerificationContext | null,
  fallbackAdminEmail: string,
): Promise<VerifyAdminTabAccessResult> {
  if (!context?.userId) {
    return {
      allowed: false,
      reason: "unauthenticated",
    };
  }

  const email = typeof context.claims?.email === "string" ? context.claims.email : "";
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify admin role.");
  }

  if (!data && email.toLowerCase() !== fallbackAdminEmail.toLowerCase()) {
    return {
      allowed: false,
      reason: "not_admin",
    };
  }

  return {
    allowed: true,
    email,
  };
}
