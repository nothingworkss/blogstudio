import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
