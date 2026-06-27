import { createClient } from "@/lib/supabase/server";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

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
