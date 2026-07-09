import { createClient } from "@supabase/supabase-js";

const storyOfUsSupabaseUrl = import.meta.env.VITE_STORYOFUS_SUPABASE_URL;
const storyOfUsSupabaseAnonKey = import.meta.env.VITE_STORYOFUS_SUPABASE_ANON_KEY;

if (!storyOfUsSupabaseUrl) {
  throw new Error("Missing VITE_STORYOFUS_SUPABASE_URL environment variable.");
}

if (!storyOfUsSupabaseAnonKey) {
  throw new Error("Missing VITE_STORYOFUS_SUPABASE_ANON_KEY environment variable.");
}

export const storyOfUsSupabase = createClient(storyOfUsSupabaseUrl, storyOfUsSupabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
