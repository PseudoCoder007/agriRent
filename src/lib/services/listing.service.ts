import { createClient } from "@/lib/supabase/server";
import {
  imageFileSchema,
  type CreateEquipmentInput,
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
 * Flat, unfiltered list of all equipment for the farmer browse page
 * (no category/location filters yet — deferred to Phase 2 per
 * SKELETON.md). Joins the first image and owner's full_name.
 */
export async function getAllEquipment(): Promise<
  ServiceResult<EquipmentWithOwnerAndImages[]>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("equipments")
    .select("*, equipment_images(id, storage_path), users(full_name)")
    .order("created_at", { ascending: false });

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
 * detail page.
 */
export async function getEquipmentById(
  id: string
): Promise<ServiceResult<EquipmentWithOwnerAndImages | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("equipments")
    .select("*, equipment_images(id, storage_path), users(full_name)")
    .eq("id", id)
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
