import { describe, expect, it } from "vitest";
import { avatarFileSchema, updateProfileSchema } from "./profile.schema";

describe("updateProfileSchema", () => {
  it("accepts a valid full name and phone", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Jane Farmer",
      phone: "9876543210",
    });
    expect(result.success).toBe(true);
  });

  it("fails with a fullName field error when full name is empty", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "",
      phone: "9876543210",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.fullName).toBeDefined();
    }
  });

  it("accepts an empty phone string (phone is optional)", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Jane Farmer",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone omitted entirely", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Jane Farmer",
    });
    expect(result.success).toBe(true);
  });

  it("fails with a phone field error when phone is too short", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Jane Farmer",
      phone: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.phone).toBeDefined();
    }
  });

  it("accepts a phone number with an optional + prefix", () => {
    const result = updateProfileSchema.safeParse({
      fullName: "Jane Farmer",
      phone: "+919876543210",
    });
    expect(result.success).toBe(true);
  });
});

describe("avatarFileSchema", () => {
  it("accepts a valid JPEG under the 5MB cap", () => {
    const result = avatarFileSchema.safeParse({
      size: 1024 * 1024,
      type: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a file over the 5MB cap", () => {
    const result = avatarFileSchema.safeParse({
      size: 6 * 1024 * 1024,
      type: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a disallowed MIME type", () => {
    const result = avatarFileSchema.safeParse({
      size: 1024,
      type: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});
