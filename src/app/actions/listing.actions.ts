"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as listingService from "@/lib/services/listing.service";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from "@/lib/validations/equipment.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

/**
 * Creates an equipment listing from a multipart form submission. Accepts
 * FormData directly (not JSON) because the form includes a file input —
 * Server Actions support this natively without manual serialization.
 *
 * ownerId is read only from the authenticated session here, never from
 * the submitted form data — a forged `ownerId` field in a direct POST
 * cannot change who owns the created listing (see T-03-01).
 */
export async function createEquipmentAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to create a listing.",
      data: null,
    };
  }

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return {
      success: false,
      message: "Please select a photo to upload.",
      data: null,
    };
  }

  const parsed = createEquipmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    rate: formData.get("rate"),
    rateUnit: formData.get("rateUnit"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await listingService.createEquipment(
    parsed.data,
    userData.user.id,
    imageFile
  );

  if (result.success) {
    revalidatePath("/browse");
  }

  return result;
}

export async function updateEquipmentAction(
  equipmentId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to edit a listing.",
      data: null,
    };
  }

  const parsed = updateEquipmentSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
    rate: formData.get("rate") || undefined,
    rateUnit: formData.get("rateUnit") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await listingService.updateEquipment(
    equipmentId,
    userData.user.id,
    parsed.data
  );

  if (result.success) {
    revalidatePath("/browse");
    revalidatePath(`/equipment/${equipmentId}`);
  }

  return result;
}

export async function deleteEquipmentAction(
  equipmentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to delete a listing.",
      data: null,
    };
  }

  const result = await listingService.softDeleteEquipment(
    equipmentId,
    userData.user.id
  );

  if (result.success) {
    revalidatePath("/browse");
    revalidatePath("/owner/dashboard");
  }

  return result;
}
