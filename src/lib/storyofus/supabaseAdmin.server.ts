import { createClient } from "@supabase/supabase-js";

const storyOfUsSupabaseUrl = process.env.VITE_STORYOFUS_SUPABASE_URL;
const storyOfUsServiceRoleKey = process.env.STORYOFUS_SUPABASE_SERVICE_ROLE_KEY;

if (!storyOfUsSupabaseUrl) {
  throw new Error("Missing VITE_STORYOFUS_SUPABASE_URL environment variable.");
}

if (!storyOfUsServiceRoleKey) {
  throw new Error("Missing STORYOFUS_SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

export const storyOfUsSupabaseAdmin = createClient(storyOfUsSupabaseUrl, storyOfUsServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
