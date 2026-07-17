import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";

let adminClient: SupabaseClient | undefined;

/** Service-role istemcisi yalnızca sunucu Route Handler'larında oluşturulur. */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SECRET_KEY",
    );
  }

  adminClient = createClient(getSupabaseConfig().url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}
