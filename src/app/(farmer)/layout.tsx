import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Enforces role=farmer for every route under this group. Defense in depth
 * beyond src/middleware.ts: re-confirms the session and role server-side on
 * every render. Role is read only from public.users — never from
 * Auth-provided metadata (see 01-CONTEXT.md D-01/D-02).
 */
export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "owner") {
    redirect("/owner/dashboard");
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b p-4">
        <span className="text-sm font-medium">AgriRent — Farmer</span>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
