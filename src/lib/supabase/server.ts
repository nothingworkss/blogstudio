import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv, hasSupabaseEnv } from "@/lib/env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!hasSupabaseEnv()) return null;
  if (!cachedClient) {
    cachedClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return cachedClient;
}
