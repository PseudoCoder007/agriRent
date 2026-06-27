import Link from "next/link";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";

import { AgriMateAIIcon } from "@/components/brand/agri-mate-ai-mark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/navigation/account-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RoleNavLinks } from "@/components/navigation/role-nav-links";
import { RoleMobileNavLinks } from "@/components/navigation/role-mobile-nav-links";

const ownerNavItems = [
  { href: "/owner/dashboard", label: "Dashboard" },
  { href: "/owner/chat", label: "Chat" },
];

/**
 * Enforces role=owner for every route under this group. Defense in depth
 * beyond src/middleware.ts: re-confirms the session and role server-side on
 * every render. Role is read only from public.users — never from
 * Auth-provided metadata (see 01-CONTEXT.md D-01/D-02).
 */
export default async function OwnerLayout({
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
    .select("role, full_name, avatar_url")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "farmer") {
    redirect("/farmer/dashboard");
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-5">
          <Link href="/owner/dashboard" className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-emerald-200/70 bg-white p-1.5 shadow-sm dark:border-emerald-500/20 dark:bg-background">
              <AgriMateAIIcon variant="navbar" className="size-6" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">AgriRent</span>
              <span className="text-xs text-muted-foreground">Owner workspace</span>
            </span>
          </Link>
          <RoleNavLinks
            items={ownerNavItems}
            className="hidden gap-4 text-sm font-medium sm:flex"
          />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <NotificationBell userId={userData.user.id} />
          <AccountMenu
            fullName={profile.full_name}
            email={userData.user.email ?? ""}
            avatarUrl={profile.avatar_url}
            profileHref="/owner/profile"
          />
        </div>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full sm:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(92vw,22rem)] border-l border-border/70 bg-background p-0 shadow-2xl sm:w-[24rem]">
            <SheetHeader className="border-b border-border/70 bg-gradient-to-br from-emerald-50 via-white to-lime-50 px-5 py-5 dark:from-emerald-950/40 dark:via-background dark:to-lime-950/20">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-emerald-200/70 bg-white p-2 shadow-sm dark:border-emerald-500/20 dark:bg-background">
                  <AgriMateAIIcon variant="navbar" className="size-6" />
                </span>
                <div>
                  <SheetTitle className="text-base font-semibold">AgriRent</SheetTitle>
                  <SheetDescription>Owner workspace</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <RoleMobileNavLinks items={ownerNavItems} />
            <div className="mt-auto flex flex-col gap-3 border-t border-border/70 px-4 py-4">
              <ThemeToggle />
              <NotificationBell userId={userData.user.id} />
              <AccountMenu
                fullName={profile.full_name}
                email={userData.user.email ?? ""}
                avatarUrl={profile.avatar_url}
                profileHref="/owner/profile"
              />
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <main>{children}</main>
    </div>
  );
}
