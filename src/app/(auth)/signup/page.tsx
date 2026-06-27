"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { signUpAction } from "@/app/actions/auth.actions";
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
import { Label } from "@/components/ui/label";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  signupSchema,
  type SignupInput,
} from "@/lib/validations/auth.schema";

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "farmer",
    },
  });
  const selectedRole = form.watch("role");

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const result = await signUpAction(values);
    const data = result.data as { confirmationPending?: boolean } | null;
    if (!result.success) {
      setServerError(result.message);
      toast.error(result.message);
    } else if (data?.confirmationPending) {
      toast.success(result.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign up as a farmer or equipment owner.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <Form {...form}>
            <div className="mb-5 space-y-3">
              <GoogleOAuthButton mode="signup" role={selectedRole} />
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
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jane Farmer"
                        className="border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="border-slate-300"
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
                      <PasswordInput className="border-slate-300" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="farmer" id="role-farmer" />
                          <Label htmlFor="role-farmer">Farmer</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="owner" id="role-owner" />
                          <Label htmlFor="role-owner">Owner</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? (
                <p className="text-sm text-destructive">{serverError}</p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-lg bg-slate-950 text-white hover:bg-slate-800"
              >
                {form.formState.isSubmitting
                  ? "Creating account..."
                  : "Sign up"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
