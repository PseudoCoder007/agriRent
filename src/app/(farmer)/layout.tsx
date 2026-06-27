import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationBell } from "@/components/notifications/NotificationBell";
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
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">AgriRent — Farmer</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/farmer/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/browse" className="text-muted-foreground hover:text-foreground">
              Browse
            </Link>
            <Link href="/farmer/favorites" className="text-muted-foreground hover:text-foreground">
              Favorites
            </Link>
            <Link href="/farmer/chat" className="text-muted-foreground hover:text-foreground">
              Chat
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell userId={userData.user.id} />
          <LogoutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
