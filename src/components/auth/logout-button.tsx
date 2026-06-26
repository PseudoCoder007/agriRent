"use client";

import { useTransition } from "react";

import { logOutAction } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";

/**
 * Renders a logout control. Embedded in both (farmer)/layout.tsx and
 * (owner)/layout.tsx so logout is reachable from every page in either
 * role group (see 01-02-PLAN.md Task 2/3).
 */
export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => {
      logOutAction();
    });
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  );
}
