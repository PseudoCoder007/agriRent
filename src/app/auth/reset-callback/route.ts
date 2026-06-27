import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the Supabase password-recovery email redirect. This route is
 * dedicated to the forgot-password flow and is separate from
 * /auth/callback (which is hardcoded to redirect into role dashboards after
 * email confirmation) — requestPasswordReset()'s redirectTo points here, not
 * at /auth/callback.
 *
 * On a valid recovery `code`, exchanges it for a session and redirects to
 * /reset-password so the user can set a new password. On a missing or
 * invalid code, redirects back to /forgot-password with an `expired` flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?expired=true`);
}
