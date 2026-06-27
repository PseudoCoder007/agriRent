import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles the Supabase email confirmation redirect. The email link lands on
 * `/?code=<uuid>` which must be exchanged for a real session. This route
 * performs that exchange, then looks up the user's role from `public.users`
 * and redirects to the appropriate dashboard.
 *
 * The Supabase project's "Site URL" setting must point to
 * `http://localhost:3000` (dev) or the production URL. The email template's
 * "Redirect URLs" must include `http://localhost:3000/auth/callback` (dev)
 * and the equivalent production URL — update these in the Supabase Auth
 * dashboard settings.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "owner") {
          return NextResponse.redirect(`${origin}/owner/dashboard`);
        }
        return NextResponse.redirect(`${origin}/farmer/dashboard`);
      }
    }
  }

  // Fallback — redirect to login with a clear error param (the page does
  // not need to display it; it's just a safe landing).
  return NextResponse.redirect(`${origin}/login?expired=true`);
}
