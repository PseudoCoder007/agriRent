// Server-only. Bypasses RLS. Never import from a Client Component.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely — use
 * ONLY for trusted, system-generated writes that must act outside the
 * current user's permissions (e.g. inserting a notification on behalf of
 * another user). Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must never be called from the browser — service_role bypasses RLS."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
