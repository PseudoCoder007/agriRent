import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "@/lib/validations/auth.schema";

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
 *
 * When Supabase email confirmation is enabled, signUp() returns session=null.
 * In that case the profile insert is done via the service-role admin client
 * (bypasses RLS since no auth.uid() exists yet) and the caller receives a
 * `confirmationPending: true` flag so the UI can display a "check your email"
 * message instead of redirecting.
 */
export async function signUp(
  input: SignupInput
): Promise<ServiceResult<{ userId: string; confirmationPending: boolean }>> {
  const supabase = await createClient();

  // Store role/full_name in user_metadata ONLY as a recovery fallback for
  // the login path. The public.users table remains the sole source of truth
  // for authorization — user_metadata is never read for RLS or middleware
  // role checks (see CLAUDE.md "What NOT to Use" on user_metadata).
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        full_name: input.fullName,
      },
    },
  });

  if (authError || !authData.user) {
    // If the user already exists (unconfirmed from a prior attempt), treat
    // it as a success — a new confirmation email was already sent by Supabase.
    // This regex covers Supabase configs that DO return an explicit error;
    // see the identities check below for the (more common, anti-enumeration)
    // case where signUp() returns no error at all for a duplicate email.
    if (authError && /already/i.test(authError.message)) {
      return {
        success: true,
        message: "Confirmation email sent — check your inbox",
        data: { userId: "", confirmationPending: true },
      };
    }

    // Supabase's default built-in email service enforces a low hourly
    // send-rate limit. This surfaces as authError.code ===
    // "over_email_send_rate_limit" (HTTP 429). It is a transient,
    // input-independent condition — the generic "Could not create account"
    // message is actively misleading here, so it gets its own message.
    if (authError?.code === "over_email_send_rate_limit") {
      console.error(
        "auth.service.signUp: email send rate limit hit",
        authError
      );
      return {
        success: false,
        message:
          "Too many signup attempts right now — please wait a few minutes and try again.",
        data: null,
      };
    }

    // Log every other unhandled signUp() error so the real Supabase error
    // code/message is never invisible, consistent with every other failure
    // branch in this file (see insert/profile-lookup/signOut branches below).
    console.error("auth.service.signUp: signUp() failed", authError);
    return {
      success: false,
      message: "Could not create account. Please try again.",
      data: null,
    };
  }

  // Supabase's anti-enumeration behavior: when email confirmation is enabled
  // and the email already belongs to an existing (confirmed or unconfirmed)
  // user, signUp() returns NO error — instead authData.user is the existing
  // user with an empty identities array and session: null. Detect this and
  // short-circuit to the same "check your email" success response before
  // ever attempting an insert, since the profile row already exists.
  if (authData.user.identities?.length === 0) {
    return {
      success: true,
      message: "Confirmation email sent — check your inbox",
      data: { userId: authData.user.id, confirmationPending: true },
    };
  }

  // Email confirmation is enabled — session is null. Insert the profile row
  // using the service-role admin client so it succeeds without an auth.uid().
  if (!authData.session) {
    const admin = createAdminClient();
    const { error: insertError } = await admin.from("users").insert({
      id: authData.user.id,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
    });

    if (insertError) {
      // Postgres unique-violation: the profile row already exists (e.g. a
      // race with a concurrent request, or a duplicate-signup path that
      // slipped past the identities/error checks above). Treat this as
      // success rather than failure — the account and profile both already
      // exist, so the user just needs to check their email.
      if (insertError.code === "23505") {
        return {
          success: true,
          message: "Confirmation email sent — check your inbox",
          data: { userId: authData.user.id, confirmationPending: true },
        };
      }
      console.error("auth.service.signUp: admin insert failed", insertError);
      return {
        success: false,
        message: "Account created but profile setup failed, contact support",
        data: null,
      };
    }

    return {
      success: true,
      message: "Confirmation email sent — check your inbox",
      data: { userId: authData.user.id, confirmationPending: true },
    };
  }

  // Session exists immediately (email confirmation disabled). Insert using
  // the regular authenticated client (relies on the INSERT RLS policy).
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
    data: { userId: authData.user.id, confirmationPending: false },
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
    console.error(
      "auth.service.logIn: profile lookup failed, attempting recovery",
      profileError
    );

    // Recovery path: the auth user exists but the public.users row was never
    // created (e.g. pre-fix signup where INSERT was blocked by RLS). Insert
    // it now via the admin client, reading role/full_name from auth user
    // metadata as a last resort, defaulting to "farmer".
    try {
      const admin = createAdminClient();
      const meta = data.user.user_metadata ?? {};
      await admin.from("users").insert({
        id: data.user.id,
        email: input.email,
        full_name:
          (meta.full_name as string) ?? input.email.split("@")[0],
        role: (meta.role as string) ?? "farmer",
      });

      const { data: retryProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (retryProfile) {
        return {
          success: true,
          message: "Logged in",
          data: { userId: data.user.id, role: retryProfile.role },
        };
      }
    } catch (recoveryError) {
      console.error(
        "auth.service.logIn: profile recovery failed",
        recoveryError
      );
    }

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
 * Resolves the base URL used to build the Supabase recovery email's
 * redirectTo link. Prefers an explicitly configured site URL, falls back to
 * Vercel's auto-populated preview/production URL, then localhost for dev.
 */
function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Requests a password reset email. Always returns the same generic success
 * message regardless of whether the email is registered — this mirrors
 * logIn()'s anti-enumeration pattern (see threat T-ax3-01 in
 * 260627-ax3-PLAN.md). The only exception is a rate-limit error, which gets
 * its own distinct, input-independent message (consistent with signUp()'s
 * over_email_send_rate_limit handling above).
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${getSiteUrl()}/auth/reset-callback`,
  });

  if (error) {
    if (error.code && /rate_limit/i.test(error.code)) {
      console.error(
        "auth.service.requestPasswordReset: rate limit hit",
        error
      );
      return {
        success: false,
        message:
          "Too many requests — please wait a few minutes and try again.",
        data: null,
      };
    }

    // Never let a non-rate-limit error (e.g. "user not found") leak to the
    // client — log it server-side and still return the generic success
    // response so the response never reveals whether the email exists.
    console.error(
      "auth.service.requestPasswordReset: resetPasswordForEmail failed",
      error
    );
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link has been sent",
    data: null,
  };
}

/**
 * Sets a new password for the currently authenticated session (established
 * by the recovery code exchange in /auth/reset-callback). Never forwards the
 * raw Supabase error text to the client (see threat T-ax3-02).
 */
export async function updatePassword(
  input: ResetPasswordInput
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    console.error("auth.service.updatePassword: updateUser failed", error);
    return {
      success: false,
      message:
        "Could not update password. The reset link may have expired — request a new one.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Password updated",
    data: null,
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
