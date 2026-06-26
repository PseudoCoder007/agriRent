import { createClient } from "@/lib/supabase/server";
import type { LoginInput, SignupInput } from "@/lib/validations/auth.schema";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

/**
 * Creates a Supabase Auth user, then inserts the matching `public.users`
 * row (id, email, full_name, role). Role is sourced only from the
 * server-validated input here — never from auth.users.user_metadata
 * anywhere downstream (see 01-CONTEXT.md D-01/D-02, CLAUDE.md "What NOT to
 * Use" on user_metadata).
 */
export async function signUp(
  input: SignupInput
): Promise<ServiceResult<{ userId: string }>> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      message: "Could not create account. Please try again.",
      data: null,
    };
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: input.email,
    full_name: input.fullName,
    role: input.role,
  });

  if (insertError) {
    console.error("auth.service.signUp: users insert failed", insertError);
    return {
      success: false,
      message: "Account created but profile setup failed, contact support",
      data: null,
    };
  }

  return {
    success: true,
    message: "Account created",
    data: { userId: authData.user.id },
  };
}

/**
 * Logs a user in via email/password. Never relays Supabase's raw auth
 * error text verbatim — a generic message avoids aiding credential
 * enumeration (see threat T-02-02 in 01-02-PLAN.md).
 */
export async function logIn(
  input: LoginInput
): Promise<ServiceResult<{ userId: string; role: "farmer" | "owner" }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    return {
      success: false,
      message: "Invalid email or password",
      data: null,
    };
  }

  // Role is always read from the server-controlled public.users table,
  // never from auth.users.user_metadata (see 01-CONTEXT.md D-01/D-02).
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    console.error("auth.service.logIn: profile lookup failed", profileError);
    return {
      success: false,
      message: "Invalid email or password",
      data: null,
    };
  }

  return {
    success: true,
    message: "Logged in",
    data: { userId: data.user.id, role: profile.role },
  };
}

/**
 * Logs the current session out.
 */
export async function logOut(): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("auth.service.logOut: signOut failed", error);
    return {
      success: false,
      message: "Could not log out. Please try again.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Logged out",
    data: null,
  };
}
