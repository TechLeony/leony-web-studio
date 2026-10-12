import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvitationClient } from "@/lib/adminInvitation";

type IsolatedInvitationClient = InvitationClient & {
  auth: Pick<SupabaseClient<Database>["auth"], "onAuthStateChange" | "signOut">;
};

export function createInvitationClient(): IsolatedInvitationClient {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key.startsWith("sb_secret_")) {
    throw new Error(
      "Invitation activation is unavailable. Check staging authentication configuration.",
    );
  }
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        globalThis.atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (payload.role !== "anon") throw new Error("Not a public key");
    } catch {
      throw new Error("Invitation activation requires a public authentication key.");
    }
  } else if (!key.startsWith("sb_publishable_")) {
    throw new Error("Invitation activation requires a public authentication key.");
  }
  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "leony-admin-invitation",
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_publishable_") && headers.get("authorization") === `Bearer ${key}`) {
          headers.delete("authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  return {
    auth: client.auth,
    getAdminRole: async (userId) => {
      const { data, error } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      return { data, error };
    },
  };
}
