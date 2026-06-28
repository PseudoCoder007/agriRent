import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildResetCallbackUrl,
  sendGeneratedRecoveryEmail,
  sendSignInEmail,
  sendWelcomeEmail,
} from "@/lib/email/mailer";
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

export async function signUp(
  input: SignupInput
): Promise<ServiceResult<{ userId: string; confirmationPending: boolean }>> {
  const supabase = await createClient();

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
    if (authError && /already/i.test(authError.message)) {
      return {
        success: true,
        message: "Confirmation email sent - check your inbox",
        data: { userId: "", confirmationPending: true },
      };
    }

    if (authError?.code === "over_email_send_rate_limit") {
      console.error("auth.service.signUp: email send rate limit hit", authError);
      return {
        success: false,
        message:
          "Too many signup attempts right now - please wait a few minutes and try again.",
        data: null,
      };
    }

    console.error("auth.service.signUp: signUp() failed", authError);
    return {
      success: false,
      message: "Could not create account. Please try again.",
      data: null,
    };
  }

  if (authData.user.identities?.length === 0) {
    return {
      success: true,
      message: "Confirmation email sent - check your inbox",
      data: { userId: authData.user.id, confirmationPending: true },
    };
  }

  if (!authData.session) {
    const admin = createAdminClient();
    const { error: insertError } = await admin.from("users").insert({
      id: authData.user.id,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: true,
          message: "Confirmation email sent - check your inbox",
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

    await sendWelcomeEmail({
      to: input.email,
      fullName: input.fullName,
      role: input.role,
    });

    return {
      success: true,
      message: "Confirmation email sent - check your inbox",
      data: { userId: authData.user.id, confirmationPending: true },
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

  await sendWelcomeEmail({
    to: input.email,
    fullName: input.fullName,
    role: input.role,
  });

  return {
    success: true,
    message: "Account created",
    data: { userId: authData.user.id, confirmationPending: false },
  };
}

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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    console.error(
      "auth.service.logIn: profile lookup failed, attempting recovery",
      profileError
    );

    try {
      const admin = createAdminClient();
      const meta = data.user.user_metadata ?? {};
      await admin.from("users").insert({
        id: data.user.id,
        email: input.email,
        full_name: (meta.full_name as string) ?? input.email.split("@")[0],
        role: (meta.role as string) ?? "farmer",
      });

      const { data: retryProfile } = await supabase
        .from("users")
        .select("role, full_name, email")
        .eq("id", data.user.id)
        .single();

      if (retryProfile) {
        await sendSignInEmail({
          to: retryProfile.email ?? input.email,
          fullName: retryProfile.full_name ?? input.email.split("@")[0],
          role: retryProfile.role,
        });

        return {
          success: true,
          message: "Logged in",
          data: { userId: data.user.id, role: retryProfile.role },
        };
      }
    } catch (recoveryError) {
      console.error("auth.service.logIn: profile recovery failed", recoveryError);
    }

    return {
      success: false,
      message: "Invalid email or password",
      data: null,
    };
  }

  await sendSignInEmail({
    to: profile.email ?? input.email,
    fullName: profile.full_name ?? input.email.split("@")[0],
    role: profile.role,
  });

  return {
    success: true,
    message: "Logged in",
    data: { userId: data.user.id, role: profile.role },
  };
}

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ServiceResult<null>> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: input.email,
    options: {
      redirectTo: buildResetCallbackUrl(),
    },
  });

  if (error) {
    if (error.code && /rate_limit/i.test(error.code)) {
      console.error("auth.service.requestPasswordReset: rate limit hit", error);
      return {
        success: false,
        message:
          "Too many requests - please wait a few minutes and try again.",
        data: null,
      };
    }

    console.error("auth.service.requestPasswordReset: generateLink failed", error);
    return {
      success: true,
      message: "If an account exists for that email, a reset link has been sent",
      data: null,
    };
  }

  const recoveryUrl = data?.properties.action_link;
  if (!recoveryUrl) {
    console.error(
      "auth.service.requestPasswordReset: missing action link from generateLink",
      data
    );
    return {
      success: true,
      message: "If an account exists for that email, a reset link has been sent",
      data: null,
    };
  }

  const { data: profile } = await admin
    .from("users")
    .select("full_name, email")
    .eq("email", input.email)
    .maybeSingle();

  await sendGeneratedRecoveryEmail({
    to: profile?.email ?? input.email,
    fullName: profile?.full_name ?? input.email.split("@")[0],
    recoveryUrl,
  });

  return {
    success: true,
    message: "If an account exists for that email, a reset link has been sent",
    data: null,
  };
}

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
        "Could not update password. The reset link may have expired - request a new one.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Password updated",
    data: null,
  };
}

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
