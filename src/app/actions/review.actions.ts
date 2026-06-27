"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as reviewService from "@/lib/services/review.service";
import { createReviewSchema } from "@/lib/validations/review.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

export async function createReviewAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to submit a review.",
      data: null,
    };
  }

  const rawEquipmentId = formData.get("equipmentId");

  const parsed = createReviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please provide a valid rating (1-5).",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await reviewService.createReview(
    parsed.data,
    userData.user.id
  );

  if (result.success && typeof rawEquipmentId === "string") {
    revalidatePath(`/equipment/${rawEquipmentId}`);
  }

  return result;
}
