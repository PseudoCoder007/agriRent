"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { SignupInput } from "@/lib/validations/auth.schema";

type GoogleOAuthButtonProps = {
  mode: "login" | "signup";
  role?: SignupInput["role"];
};

function buildRedirectUrl(mode: GoogleOAuthButtonProps["mode"], role?: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("mode", mode);
  if (role) {
    url.searchParams.set("role", role);
  }
  return url.toString();
}

export function GoogleOAuthButton({ mode, role }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildRedirectUrl(mode, role),
      },
    });

    if (error) {
      setLoading(false);
      return;
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-full border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent"
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-foreground dark:text-background dark:ring-border">
        G
      </span>
      {loading ? "Connecting..." : `Continue with Google`}
    </Button>
  );
}
