"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { requestPasswordResetAction } from "@/app/actions/auth.actions";
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
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth.schema";

export default function ForgotPasswordPage() {
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setResponseMessage(null);
    const result = await requestPasswordResetAction(values);
    setResponseMessage(result.message);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/60 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/login" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to log in
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Forgot password?
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <Form {...form}>
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {responseMessage ? (
                <p className="text-sm text-slate-600">{responseMessage}</p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-lg bg-slate-950 text-white hover:bg-slate-800"
              >
                {form.formState.isSubmitting
                  ? "Sending..."
                  : "Send reset link"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
