"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as favoritesService from "@/lib/services/favorites.service";
import { toggleFavoriteSchema } from "@/lib/validations/favorites.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

export async function toggleFavoriteAction(
  equipmentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to save favorites.",
      data: null,
    };
  }

  const parsed = toggleFavoriteSchema.safeParse({ equipmentId });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid equipment ID",
      data: null,
    };
  }

  const result = await favoritesService.toggleFavorite(
    userData.user.id,
    parsed.data.equipmentId
  );

  if (result.success) {
    revalidatePath("/farmer/favorites");
    revalidatePath(`/equipment/${equipmentId}`);
  }

  return result;
}
