import { createClient } from "@/lib/supabase/server";
import {
  imageFileSchema,
  type CreateEquipmentInput,
  type UpdateEquipmentInput,
} from "@/lib/validations/equipment.schema";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type EquipmentRow = Tables<"equipments">;

export type EquipmentWithOwnerAndImages = EquipmentRow & {
  equipment_images: Pick<Tables<"equipment_images">, "id" | "storage_path">[];
  users: Pick<Tables<"users">, "full_name"> | null;
};

const EQUIPMENT_BUCKET = "equipment-images";

/**
 * Builds the public URL for a stored equipment image path. The
 * equipment-images bucket is public-read (see
 * supabase/migrations/0002_equipment_images_bucket.sql), so this is a
 * deterministic URL construction, not a fetch.
 */
export function getEquipmentImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${EQUIPMENT_BUCKET}/${storagePath}`;
}

/**
 * Creates an equipment listing and uploads its first photo to Supabase
 * Storage. ownerId is always supplied by the caller (a Server Action that
 * reads it from the authenticated session) — never accepted from this
 * function's `input` parameter, so a forged client field cannot change who
 * owns the created listing (see T-03-01). The RLS INSERT policy on
 * equipments additionally enforces `owner_id = auth.uid()` at the database
 * layer as a second, independent guarantee. The role check below mirrors
 * the rest of this codebase's defense-in-depth pattern (e.g.
 * booking.service.ts's getOwnedPendingBooking) of never relying on RLS as
 * the sole enforcement layer for a mutating write.
 */
export async function createEquipment(
  input: CreateEquipmentInput,
  ownerId: string,
  imageFile: File
): Promise<ServiceResult<EquipmentRow>> {
  const imageCheck = imageFileSchema.safeParse({
    size: imageFile.size,
    type: imageFile.type,
  });

  if (!imageCheck.success) {
    return {
      success: false,
      message: "Invalid image: must be JPEG/PNG/WebP under 5MB",
      data: null,
    };
  }

  const supabase = await createClient();

  const { data: callerUser, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", ownerId)
    .single();

  if (roleError || !callerUser || callerUser.role !== "owner") {
    return {
      success: false,
      message: "Only owner accounts can create equipment listings.",
      data: null,
    };
  }

  const { data: equipment, error: insertError } = await supabase
    .from("equipments")
    .insert({
      owner_id: ownerId,
      title: input.title,
      description: input.description,
      category: input.category,
      rate: input.rate,
      rate_unit: input.rateUnit,
      location: input.location,
    })
    .select()
    .single();

  if (insertError || !equipment) {
    console.error(
      "listing.service.createEquipment: equipments insert failed",
      insertError
    );
    return {
      success: false,
      message: "Could not create equipment listing. Please try again.",
      data: null,
    };
  }

  const storagePath = `${ownerId}/${equipment.id}/${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from(EQUIPMENT_BUCKET)
    .upload(storagePath, imageFile, { contentType: imageFile.type });

  if (uploadError) {
    console.error(
      "listing.service.createEquipment: image upload failed",
      uploadError
    );
    return {
      success: true,
      message:
        "Equipment created, but the photo failed to upload. You can add a photo later.",
      data: equipment,
    };
  }

  const { error: imageInsertError } = await supabase
    .from("equipment_images")
    .insert({ equipment_id: equipment.id, storage_path: storagePath });

  if (imageInsertError) {
    console.error(
      "listing.service.createEquipment: equipment_images insert failed",
      imageInsertError
    );
    return {
      success: true,
      message:
        "Equipment created, but the photo failed to save. You can add a photo later.",
      data: equipment,
    };
  }

  return {
    success: true,
    message: "Equipment created",
    data: equipment,
  };
}

/**
 * Updates an equipment listing's editable fields. Ownership is re-verified
 * server-side BEFORE the write — the ownerId is from the authenticated
 * session, never from the submitted form data.
 */
export async function updateEquipment(
  equipmentId: string,
  ownerId: string,
  input: UpdateEquipmentInput
): Promise<ServiceResult<EquipmentRow>> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("equipments")
    .select("owner_id")
    .eq("id", equipmentId)
    .single();

  if (!existing || existing.owner_id !== ownerId) {
    return {
      success: false,
      message: "You do not have permission to edit this listing",
      data: null,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("equipments")
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.rate !== undefined && { rate: input.rate }),
      ...(input.rateUnit !== undefined && { rate_unit: input.rateUnit }),
      ...(input.location !== undefined && { location: input.location }),
    })
    .eq("id", equipmentId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error(
      "listing.service.updateEquipment: update failed",
      updateError
    );
    return {
      success: false,
      message: "Could not update equipment listing.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Equipment updated",
    data: updated,
  };
}

/**
 * Soft-deletes an equipment listing by setting deleted_at. Ownership is
 * re-verified server-side before the write. The row remains in the database
 * so existing bookings still resolve their FK reference without error.
 */
export async function softDeleteEquipment(
  equipmentId: string,
  ownerId: string
): Promise<ServiceResult<null>> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("equipments")
    .select("owner_id")
    .eq("id", equipmentId)
    .single();

  if (!existing || existing.owner_id !== ownerId) {
    return {
      success: false,
      message: "You do not have permission to delete this listing",
      data: null,
    };
  }

  const { error: updateError } = await supabase
    .from("equipments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", equipmentId);

  if (updateError) {
    console.error(
      "listing.service.softDeleteEquipment: update failed",
      updateError
    );
    return {
      success: false,
      message: "Could not delete listing.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Listing deleted",
    data: null,
  };
}

/**
 * List all non-deleted equipment for the farmer browse page, optionally
 * filtered by category and/or location. Category uses exact match; location
 * uses case-insensitive substring match (ILIKE). Both filters are applied
 * server-side via the Supabase query builder — never fetched-all-then-
 * filtered client-side (see Pattern 1 in 02-RESEARCH.md).
 */
export async function getAllEquipment(filters?: {
  category?: string;
  location?: string;
}): Promise<ServiceResult<EquipmentWithOwnerAndImages[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("equipments")
    .select("*, equipment_images(id, storage_path), users(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listing.service.getAllEquipment: query failed", error);
    return {
      success: false,
      message: "Could not load equipment listings.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Equipment listings loaded",
    data: data as EquipmentWithOwnerAndImages[],
  };
}

/**
 * Single equipment row with all images and owner info, for the farmer
 * detail page. Soft-deleted listings return null (404) for non-owners.
 * The owner's dashboard uses getEquipmentByOwner (unfiltered) instead.
 */
export async function getEquipmentById(
  id: string
): Promise<ServiceResult<EquipmentWithOwnerAndImages | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("equipments")
    .select("*, equipment_images(id, storage_path), users(full_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("listing.service.getEquipmentById: query failed", error);
    return {
      success: false,
      message: "Could not load equipment listing.",
      data: null,
    };
  }

  return {
    success: true,
    message: data ? "Equipment listing loaded" : "Equipment not found",
    data: data as EquipmentWithOwnerAndImages | null,
  };
}

/**
 * Equipment owned by a single owner, joined with their first image.
 * This is the function the owner dashboard (Plan 01-05) MUST call —
 * owner-scoped equipment reads never bypass the service layer with a raw
 * query, per CLAUDE.md's "never write raw SQL inside components" rule.
 */
export async function getEquipmentByOwner(
  ownerId: string
): Promise<ServiceResult<EquipmentWithOwnerAndImages[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("equipments")
    .select("*, equipment_images(id, storage_path), users(full_name)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listing.service.getEquipmentByOwner: query failed",
      error
    );
    return {
      success: false,
      message: "Could not load your equipment listings.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Equipment listings loaded",
    data: data as EquipmentWithOwnerAndImages[],
  };
}
