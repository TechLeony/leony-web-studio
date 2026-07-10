import { createClient } from "@supabase/supabase-js";

const storyOfUsSupabaseUrl = process.env.VITE_STORYOFUS_SUPABASE_URL;
const storyOfUsServiceRoleKey = process.env.STORYOFUS_SUPABASE_SERVICE_ROLE_KEY;

if (!storyOfUsSupabaseUrl) {
  throw new Error("Missing VITE_STORYOFUS_SUPABASE_URL environment variable.");
}

if (!storyOfUsServiceRoleKey) {
  throw new Error("Missing STORYOFUS_SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

if (storyOfUsServiceRoleKey.startsWith("sb_publishable_")) {
  throw new Error(
    "STORYOFUS_SUPABASE_SERVICE_ROLE_KEY must be a Supabase secret/service-role key, but it looks like a publishable key.",
  );
}

const legacyJwtRole = getLegacyJwtRole(storyOfUsServiceRoleKey);

if (legacyJwtRole && legacyJwtRole !== "service_role") {
  throw new Error(
    "STORYOFUS_SUPABASE_SERVICE_ROLE_KEY must be a service_role key, but the configured legacy JWT role is not service_role.",
  );
}

export const storyOfUsSupabaseAdmin = createClient(storyOfUsSupabaseUrl, storyOfUsServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function getLegacyJwtRole(key: string) {
  if (!key.startsWith("eyJ")) {
    return null;
  }

  try {
    const payload = key.split(".")[1];
    if (!payload) {
      return null;
    }

    const paddedPayload = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const parsed = JSON.parse(globalThis.atob(paddedPayload)) as { role?: unknown };

    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}
