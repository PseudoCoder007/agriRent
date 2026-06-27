import Link from "next/link";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
          <nav className="hidden gap-3 text-sm sm:flex">
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
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <NotificationBell userId={userData.user.id} />
          <LogoutButton />
        </div>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <nav className="flex flex-col gap-1 p-4">
              <SheetClose
                nativeButton={false}
                render={
                  <Link href="/farmer/dashboard" className="text-muted-foreground hover:text-foreground" />
                }
              >
                Dashboard
              </SheetClose>
              <SheetClose
                nativeButton={false}
                render={
                  <Link href="/browse" className="text-muted-foreground hover:text-foreground" />
                }
              >
                Browse
              </SheetClose>
              <SheetClose
                nativeButton={false}
                render={
                  <Link href="/farmer/favorites" className="text-muted-foreground hover:text-foreground" />
                }
              >
                Favorites
              </SheetClose>
              <SheetClose
                nativeButton={false}
                render={
                  <Link href="/farmer/chat" className="text-muted-foreground hover:text-foreground" />
                }
              >
                Chat
              </SheetClose>
            </nav>
            <div className="flex flex-col gap-2 border-t p-4 pt-3">
              <ThemeToggle />
              <NotificationBell userId={userData.user.id} />
              <LogoutButton />
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <main>{children}</main>
    </div>
  );
}
