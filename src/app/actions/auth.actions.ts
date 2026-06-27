"use server";

import { redirect } from "next/navigation";

import * as authService from "@/lib/services/auth.service";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

function dashboardPathForRole(role: SignupInput["role"]) {
  return role === "owner" ? "/owner/dashboard" : "/farmer/dashboard";
}

export async function signUpAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authService.signUp(parsed.data);
  if (!result.success) {
    return result;
  }

  // Email confirmation required — show "check your inbox" message on the
  // signup page instead of redirecting (user has no session yet).
  if (result.data?.confirmationPending) {
    return result;
  }

  redirect(dashboardPathForRole(parsed.data.role));
}

export async function logInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authService.logIn(parsed.data);
  if (!result.success || !result.data) {
    return result;
  }

  redirect(dashboardPathForRole(result.data.role));
}

export async function logOutAction(): Promise<void> {
  await authService.logOut();
  redirect("/login");
}
