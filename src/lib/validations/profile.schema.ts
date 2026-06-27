import { z } from "zod";

/**
 * Profile update payload. Deliberately has no `userId`/`id` field: the
 * server always derives identity from the authenticated session (see
 * profile.service.ts updateProfile), never trusting a client-submitted
 * user id — mirrors equipment.schema.ts's createEquipmentSchema convention.
 *
 * Phone is optional — an empty string or omitted field is valid (matches
 * UI-SPEC's "Optional field"), but when present it must match a loose
 * international phone format (optional leading "+", 10-15 digits).
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Display name is required")
    .max(100),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Re-validates an uploaded avatar file's metadata server-side before it is
 * handed to Supabase Storage — defense in depth alongside the avatars
 * bucket's own allowed_mime_types/file_size_limit restriction (see
 * T-03.4-03 in 03.4-01-PLAN.md's threat model). A client's `accept`
 * attribute on the file input is a UX hint only and is trivially bypassed
 * via a direct API call.
 *
 * This duplicates imageFileSchema from equipment.schema.ts rather than
 * importing it, keeping profile.schema.ts free of cross-imports from the
 * equipment domain.
 */
export const avatarFileSchema = z.object({
  size: z
    .number()
    .max(5 * 1024 * 1024, "Image must be under 5MB"),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "Image must be JPEG, PNG, or WebP",
  }),
});

export type AvatarFileInput = z.infer<typeof avatarFileSchema>;
