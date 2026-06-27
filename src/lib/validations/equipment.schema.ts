import { z } from "zod";

/**
 * Equipment creation payload. Category is restricted to the exact 6-value
 * fixed enum from 01-CONTEXT.md D-03 — do not deviate from this list.
 * Deliberately has no ownerId field: the server always derives ownerId
 * from the authenticated session (see listing.service.ts createEquipment),
 * never trusting a client-submitted owner.
 */
export const createEquipmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    "Tractor",
    "Harvester",
    "Plough",
    "Rotavator",
    "Sprayer",
    "Other",
  ]),
  rate: z.coerce.number().positive(),
  rateUnit: z.enum(["hour", "day"]),
  location: z.string().max(200).optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

/**
 * Re-validates an uploaded image file's metadata server-side before it is
 * handed to Supabase Storage — defense in depth alongside the
 * equipment-images bucket's own allowed_mime_types/file_size_limit
 * restriction (see T-03-03 in 01-03-PLAN.md's threat model). A client's
 * `accept` attribute on the file input is a UX hint only and is trivially
 * bypassed via a direct API call.
 */
export const imageFileSchema = z.object({
  size: z
    .number()
    .max(5 * 1024 * 1024, "Image must be under 5MB"),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], {
    error: "Image must be JPEG, PNG, or WebP",
  }),
});

export type ImageFileInput = z.infer<typeof imageFileSchema>;

/**
 * Equipment edit payload — same shape as create, but all fields optional
 * for partial updates. No ownerId field: the server always derives it
 * from the authenticated session, never from the form submission.
 */
export const updateEquipmentSchema = createEquipmentSchema.partial();

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
