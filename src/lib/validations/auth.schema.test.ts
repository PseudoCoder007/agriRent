import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth.schema";

describe("signupSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      fullName: "Test User",
      role: "farmer",
    });
    expect(result.success).toBe(true);
  });

  it("fails with field errors for invalid email, password, and role", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "short",
      fullName: "",
      role: "invalid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.email).toBeDefined();
      expect(fieldErrors.password).toBeDefined();
      expect(fieldErrors.role).toBeDefined();
    }
  });

  it("rejects a role value outside the farmer/owner enum", () => {
    const result = signupSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      fullName: "Test User",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("fails when password is missing", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
    });
    expect(result.success).toBe(false);
  });
});
