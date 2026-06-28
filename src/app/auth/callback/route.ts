import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendSignInEmail, sendWelcomeEmail } from "@/lib/email/mailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const oauthRoleSchema = z.enum(["farmer", "owner"]);

type OAuthUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function buildFullName(user: OAuthUser): string {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Google user";
}

/**
 * Handles the Supabase email confirmation redirect. The email link lands on
 * `/?code=<uuid>` which must be exchanged for a real session. This route
 * performs that exchange, then looks up the user's role from `public.users`
 * and redirects to the appropriate dashboard.
 *
 * Google OAuth uses the same route. When a first-time Google user signs in,
 * the callback can create the matching `public.users` row if the auth
 * request included a role query param from the signup page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role");

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
          .select("role, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "owner" || profile?.role === "farmer") {
          await sendSignInEmail({
            to: profile.email ?? user.email ?? "",
            fullName: profile.full_name ?? user.email?.split("@")[0] ?? "there",
            role: profile.role,
          });

          return NextResponse.redirect(`${origin}/${profile.role}/dashboard`);
        }

        const parsedRole = oauthRoleSchema.safeParse(roleParam);
        if (parsedRole.success) {
          const admin = createAdminClient();
          const { error: insertError } = await admin.from("users").upsert(
            {
              id: user.id,
              email: user.email ?? "",
              full_name: buildFullName({
                email: user.email,
                user_metadata: user.user_metadata as
                  | Record<string, unknown>
                  | null,
              }),
              role: parsedRole.data,
            },
            { onConflict: "id" }
          );

          if (!insertError) {
            await sendWelcomeEmail({
              to: user.email ?? "",
              fullName: buildFullName({
                email: user.email,
                user_metadata: user.user_metadata as
                  | Record<string, unknown>
                  | null,
              }),
              role: parsedRole.data,
            });

            return NextResponse.redirect(
              `${origin}/${parsedRole.data}/dashboard`
            );
          }
        }
      }
    }
  }

  if (!roleParam) {
    return NextResponse.redirect(`${origin}/signup?google=choose-role`);
  }

  // Fallback â€” redirect to login with a clear error param (the page does
  // not need to display it; it's just a safe landing).
  return NextResponse.redirect(`${origin}/login?expired=true`);
}
