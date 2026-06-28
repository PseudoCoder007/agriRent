"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { logInAction } from "@/app/actions/auth.actions";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await logInAction(values);
    if (!result.success) {
      setServerError(result.message);
      toast.error(result.message);
    }
  }

  return (
    <main className="force-light flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Log in to your AgriRent account.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <Form {...form}>
            <div className="mb-5 space-y-3">
              <GoogleOAuthButton mode="login" />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-400">
                  <span className="bg-white px-3">or</span>
                </div>
              </div>
            </div>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 rounded-xl border-slate-300 bg-slate-50/95 px-4 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:bg-slate-900/70 dark:text-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        className="h-11 rounded-xl border-slate-300 bg-slate-50/95 px-4 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:bg-slate-900/70 dark:text-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="-mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {serverError ? (
                <p className="text-sm text-destructive">{serverError}</p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-lg bg-slate-950 text-white hover:bg-slate-800"
              >
                {form.formState.isSubmitting ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
