import { createClient } from "@/lib/supabase/server";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type FavoriteWithEquipment = Tables<"favorites"> & {
  equipments: Tables<"equipments"> & {
    equipment_images: Pick<Tables<"equipment_images">, "id" | "storage_path">[];
    users: Pick<Tables<"users">, "full_name"> | null;
  };
};

/**
 * Toggles a farmer's favorite status for a piece of equipment. If already
 * favorited, removes it; otherwise adds it. Returns the new state.
 */
export async function toggleFavorite(
  farmerId: string,
  equipmentId: string
): Promise<ServiceResult<{ favorited: boolean }>> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("farmer_id", farmerId)
    .eq("equipment_id", equipmentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("favorites.service.toggleFavorite: delete failed", error);
      return {
        success: false,
        message: "Could not remove favorite",
        data: null,
      };
    }

    return {
      success: true,
      message: "Removed from favorites",
      data: { favorited: false },
    };
  }

  const { error } = await supabase.from("favorites").insert({
    farmer_id: farmerId,
    equipment_id: equipmentId,
  });

  if (error) {
    console.error("favorites.service.toggleFavorite: insert failed", error);
    return {
      success: false,
      message: "Could not save favorite",
      data: null,
    };
  }

  return {
    success: true,
    message: "Saved to favorites",
    data: { favorited: true },
  };
}

/**
 * Returns all equipment the current farmer has favorited, joined with
 * equipment details and images.
 */
export async function getFavoritesForFarmer(
  farmerId: string
): Promise<ServiceResult<FavoriteWithEquipment[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select(
      "*, equipments(*, equipment_images(id, storage_path), users(full_name))"
    )
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "favorites.service.getFavoritesForFarmer: query failed",
      error
    );
    return {
      success: false,
      message: "Could not load favorites",
      data: null,
    };
  }

  return {
    success: true,
    message: "Favorites loaded",
    data: data as FavoriteWithEquipment[],
  };
}

/**
 * Returns whether a specific piece of equipment is favorited by the farmer.
 * Used to set the initial pressed state of the toggle button.
 */
export async function isFavorited(
  farmerId: string,
  equipmentId: string
): Promise<ServiceResult<boolean>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("farmer_id", farmerId)
    .eq("equipment_id", equipmentId)
    .maybeSingle();

  return {
    success: true,
    message: "OK",
    data: !!data,
  };
}
