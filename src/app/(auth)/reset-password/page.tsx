"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updatePasswordAction } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth.schema";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setResponseMessage(null);
    const result = await updatePasswordAction(values);
    setResponseMessage(result.message);

    if (result.success) {
      toast.success(result.message);
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/60 to-white p-4 dark:from-background dark:to-background">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-muted-foreground">
            Choose a new password for your AgriRent account.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8 dark:bg-card">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {responseMessage ? (
                <p className="text-sm text-slate-600 dark:text-muted-foreground">{responseMessage}</p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-lg bg-slate-950 text-white hover:bg-slate-800"
              >
                {form.formState.isSubmitting
                  ? "Updating..."
                  : "Update password"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
