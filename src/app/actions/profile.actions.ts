"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as profileService from "@/lib/services/profile.service";
import { updateProfileSchema } from "@/lib/validations/profile.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

/**
 * Updates the authenticated user's own profile (full_name/phone). `userId`
 * is derived exclusively from `supabase.auth.getUser()` — never accepted as
 * a parameter from `values`, so a forged userId in a direct POST cannot
 * update another user's row (see T-03.4-04). `values` is re-validated
 * server-side against `updateProfileSchema` even though `profile-form.tsx`
 * already validates client-side via `zodResolver` — client validation is UX
 * only and is trivially bypassed (see T-03.4-05).
 */
export async function updateProfileAction(values: {
  fullName: string;
  phone?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to update your profile.",
      data: null,
    };
  }

  const parsed = updateProfileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await profileService.updateProfile(
    userData.user.id,
    parsed.data
  );

  if (result.success) {
    revalidatePath("/farmer");
    revalidatePath("/owner");
    revalidatePath("/farmer/profile");
    revalidatePath("/owner/profile");
  }

  return result;
}
