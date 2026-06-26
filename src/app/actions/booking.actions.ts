"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as bookingService from "@/lib/services/booking.service";
import { createBookingSchema } from "@/lib/validations/booking.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

function revalidateDashboards() {
  revalidatePath("/farmer/dashboard");
  revalidatePath("/owner/dashboard");
}

/**
 * Creates a booking request from a multipart/urlencoded form submission.
 * Parses with createBookingSchema.safeParse first — its `.strict()` causes
 * a parse failure if a tampered payload includes `total_amount`/`status`
 * fields, rejecting before bookingService is ever called. farmerId is
 * read only from the authenticated session, never from form data (mirrors
 * the ownerId pattern in listing.actions.ts's createEquipmentAction).
 */
export async function createBookingAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to request a booking.",
      data: null,
    };
  }

  const parsed = createBookingSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please select a valid date range",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await bookingService.createBooking(
    parsed.data,
    userData.user.id
  );

  if (result.success) {
    revalidateDashboards();
  }

  return result;
}

/**
 * Approves a pending booking. Never accepts a target status from the
 * caller — bookingService.approveBooking hardcodes 'approved' internally
 * (see T-05-04). ownerId is read only from the authenticated session.
 */
export async function approveBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to approve a booking.",
      data: null,
    };
  }

  const result = await bookingService.approveBooking(
    bookingId,
    userData.user.id
  );

  if (result.success) {
    revalidateDashboards();
  }

  return result;
}

/**
 * Rejects a pending booking. Mirrors approveBookingAction; the target
 * status ('rejected') is hardcoded inside bookingService.rejectBooking.
 */
export async function rejectBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to reject a booking.",
      data: null,
    };
  }

  const result = await bookingService.rejectBooking(
    bookingId,
    userData.user.id
  );

  if (result.success) {
    revalidateDashboards();
  }

  return result;
}
