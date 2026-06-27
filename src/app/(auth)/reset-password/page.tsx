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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,200,130,0.22),_transparent_45%),linear-gradient(180deg,_#f7fbf6_0%,_#eef5ea_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-sm flex-col justify-center">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Set a new password
            </h1>
            <p className="text-sm text-slate-600">
              Choose a new password for your AgriRent account.
            </p>
          </div>

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
                <p className="text-sm text-slate-600">{responseMessage}</p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-full bg-slate-950 text-white hover:bg-slate-800"
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
