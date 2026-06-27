"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";

import { logOutAction } from "@/app/actions/auth.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountMenuProps = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  profileHref: "/farmer/profile" | "/owner/profile";
};

/**
 * Replaces the bare LogoutButton in both role layouts. Consolidates
 * identity, profile access, and logout into one conventional account-menu
 * pattern, per 03.4-UI-SPEC.md's "Entry Point Decision".
 */
export function AccountMenu({
  fullName,
  email,
  avatarUrl,
  profileHref,
}: AccountMenuProps) {
  const [isPending, startTransition] = useTransition();

  const displayName = fullName?.trim() || email.split("@")[0] || "Account";
  const fallbackInitial = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    startTransition(() => {
      logOutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-11 w-full justify-start gap-2"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-left text-sm font-semibold">
          {displayName}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href={profileHref}>
              <User />
              Edit profile
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut />
          {isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
