import { z } from "zod";

/**
 * Signup payload — role is restricted to the two valid account roles
 * (farmer/owner). Role is chosen once at signup and is never re-editable
 * (see .planning/phases/01-walking-skeleton/01-CONTEXT.md D-01/D-02).
 */
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["farmer", "owner"]),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
