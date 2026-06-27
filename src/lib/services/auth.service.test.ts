import { describe, expect, it, vi } from "vitest";

/**
 * auth.service.ts's signUp() talks to Supabase via src/lib/supabase/server.ts's
 * createClient(). We mock that module so we can drive specific
 * signUp()/authError responses without a real Supabase project.
 *
 * Regression coverage for the reopened signup-email-confirmation-bug debug
 * session: the unhandled-error branch previously collapsed every
 * authError (including the documented over_email_send_rate_limit 429) into
 * one generic, unlogged "Could not create account" message.
 */

function makeFakeSupabaseAuth({
  authData,
  authError,
}: {
  authData?: { user: unknown; session: unknown } | null;
  authError?: { message: string; code?: string } | null;
}) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: authData ?? { user: null, session: null },
        error: authError ?? null,
      }),
    },
    from: vi.fn(() => {
      throw new Error("Unexpected table access in test mock");
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const signupInput = {
  email: "farmer@example.com",
  password: "password123",
  fullName: "Test Farmer",
  role: "farmer" as const,
};

describe("signUp", () => {
  it("returns a distinct rate-limit message (not the generic failure) when Supabase returns over_email_send_rate_limit", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseAuth({
        authData: { user: null, session: null },
        authError: {
          message: "email rate limit exceeded",
          code: "over_email_send_rate_limit",
        },
      })
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { signUp } = await import("./auth.service");
    const result = await signUp(signupInput);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message.toLowerCase()).toContain("too many signup attempts");
    expect(result.message).not.toBe(
      "Could not create account. Please try again."
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("rate limit"),
      expect.objectContaining({ code: "over_email_send_rate_limit" })
    );

    consoleErrorSpy.mockRestore();
  });

  it("logs the authError for any other unhandled signUp() failure (previously silent)", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseAuth({
        authData: { user: null, session: null },
        authError: { message: "Some unexpected auth failure", code: "unexpected_failure" },
      })
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { signUp } = await import("./auth.service");
    const result = await signUp(signupInput);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Could not create account. Please try again.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("signUp() failed"),
      expect.objectContaining({ code: "unexpected_failure" })
    );

    consoleErrorSpy.mockRestore();
  });
});
