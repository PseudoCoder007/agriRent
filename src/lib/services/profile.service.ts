import { createClient } from "@/lib/supabase/server";
import { avatarFileSchema } from "@/lib/validations/profile.schema";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

const AVATAR_BUCKET = "avatars";

/**
 * Updates a user's editable profile fields (full_name/phone). `userId` is
 * always supplied by the caller (a Server Action that derives it from
 * `supabase.auth.getUser()`) — never accepted from this function's `input`
 * parameter, so a forged client field cannot change whose row is updated
 * (mirrors listing.service.ts's updateEquipment/createEquipment pattern,
 * see T-03.4-04). The `.eq("id", userId)` scope is the second, independent
 * guarantee alongside the existing own-row-only RLS UPDATE policy.
 *
 * An empty-string phone is normalized to `null` (not stored as `""`), since
 * the column is nullable and "no phone" should read as null, not an empty
 * string.
 */
export async function updateProfile(
  userId: string,
  input: { fullName?: string; phone?: string }
): Promise<ServiceResult<Tables<"users">>> {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("users")
    .update({
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error || !updated) {
    console.error("profile.service.updateProfile: update failed", error);
    return {
      success: false,
      message: "Could not update your profile. Please try again.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Profile updated",
    data: updated,
  };
}

/**
 * Builds the public, cache-busted URL for a stored avatar path. The avatars
 * bucket is public-read (see supabase/migrations/0008_profile_fields.sql),
 * so this is a deterministic URL construction, not a fetch — mirrors
 * listing.service.ts's getEquipmentImageUrl. A `?v=` query param derived
 * from avatar_updated_at is always appended so the browser/CDN never serves
 * a stale cached copy of a previous avatar at the same fixed path.
 */
export function getAvatarUrl(
  storagePath: string,
  avatarUpdatedAt: string | null
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${storagePath}`;
  const version = avatarUpdatedAt ? new Date(avatarUpdatedAt).getTime() : Date.now();
  return `${baseUrl}?v=${version}`;
}

/**
 * Uploads or replaces a user's profile photo. `userId` is always supplied by
 * the caller (a Server Action that derives it from
 * `supabase.auth.getUser()`) — never accepted from this function's
 * `imageFile` parameter, mirroring updateProfile's identity-derivation
 * pattern (see T-03.4-08). The storage path is fixed per user
 * (`${userId}/avatar.<ext>`), not a per-upload unique filename, so repeat
 * uploads overwrite the same object rather than orphaning previous avatars
 * in Storage forever. `upsert: true` is REQUIRED on the Storage call —
 * omitting it causes every repeat upload to fail with a 400 "Asset Already
 * Exists" error.
 */
export async function uploadAvatar(
  userId: string,
  imageFile: File
): Promise<ServiceResult<string>> {
  const imageCheck = avatarFileSchema.safeParse({
    size: imageFile.size,
    type: imageFile.type,
  });

  if (!imageCheck.success) {
    return {
      success: false,
      message: "Invalid image: must be JPEG, PNG, or WebP under 5MB",
      data: null,
    };
  }

  const supabase = await createClient();

  const ext = imageFile.name.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) {
    console.error(
      "profile.service.uploadAvatar: upload failed",
      uploadError
    );
    return {
      success: false,
      message: "Could not upload your photo. Please try again.",
      data: null,
    };
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      avatar_url: storagePath,
      avatar_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    console.error(
      "profile.service.uploadAvatar: users update failed",
      updateError
    );
    return {
      success: false,
      message: "Photo uploaded, but could not save to your profile.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Profile photo updated",
    data: storagePath,
  };
}
