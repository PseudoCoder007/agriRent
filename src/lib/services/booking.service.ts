import { differenceInCalendarDays } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import * as notificationService from "@/lib/services/notification.service";
import type { CreateBookingInput } from "@/lib/validations/booking.schema";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type BookingRow = Tables<"bookings">;

export type BookingWithEquipment = BookingRow & {
  equipments: Pick<Tables<"equipments">, "id" | "title" | "owner_id"> | null;
};

export type BookingWithEquipmentAndFarmer = BookingRow & {
  equipments: Pick<Tables<"equipments">, "id" | "title" | "owner_id"> | null;
  users: Pick<Tables<"users">, "full_name"> | null;
};

/**
 * Allow-list of valid booking status transitions. Mirrors the Postgres
 * trigger enforce_booking_status_transition() in 0005_phase2_schema.sql.
 * Both layers must always agree — this is the primary check, the PG
 * trigger is defense-in-depth.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["completed", "cancelled"],
};

const PENDING_ONLY_GUARD_MESSAGE =
  "This booking has already been actioned and can no longer be changed.";

/**
 * Computes the number of rate-units to bill for an inclusive date range.
 * Daily-rate duration is the primary path for Phase 1's date-range
 * booking model (per 01-05-PLAN.md Task 1 action notes); +1 makes the
 * range inclusive of both the start and end date.
 */
function computeDurationInUnits(startDate: string, endDate: string): number {
  const duration =
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
  return Math.max(duration, 1);
}

/**
 * Detects a Postgres exclusion-violation (23P01) regardless of exactly
 * where the Supabase client surfaces the error code — some client/error
 * shapes nest it under `.code`, others under `.details`/`.cause`. Checking
 * multiple locations avoids silently missing the EXCLUDE constraint hit
 * and leaking a raw 500 instead of the friendly message (see T-05-02).
 */
function isExclusionViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  if (err.code === "23P01") return true;
  if (typeof err.details === "string" && err.details.includes("23P01")) {
    return true;
  }
  if (typeof err.message === "string" && err.message.includes("23P01")) {
    return true;
  }
  return false;
}

/**
 * Creates a booking request. `total_amount` is always computed here from
 * the equipment's server-fetched `rate` — never accepted from `input`,
 * which is typed from `createBookingSchema` and structurally cannot carry
 * a price field (see T-05-01). The Postgres `bookings_no_overlap` EXCLUDE
 * constraint (0001_init_schema.sql) is the authoritative no-double-booking
 * guarantee; a 23P01 violation here is translated to a friendly message,
 * never a raw 500 (T-05-02). The owner's "new booking request"
 * notification is awaited before this function returns — never
 * fire-and-forget (T-05-05).
 */
export async function createBooking(
  input: CreateBookingInput,
  farmerId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();

  const { data: equipment, error: equipmentError } = await supabase
    .from("equipments")
    .select("rate, rate_unit, owner_id")
    .eq("id", input.equipmentId)
    .single();

  if (equipmentError || !equipment) {
    console.error(
      "booking.service.createBooking: equipment lookup failed",
      equipmentError
    );
    return {
      success: false,
      message: "Could not find this equipment listing.",
      data: null,
    };
  }

  const durationInUnits = computeDurationInUnits(
    input.startDate,
    input.endDate
  );
  const totalAmount = Number(equipment.rate) * durationInUnits;

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      equipment_id: input.equipmentId,
      farmer_id: farmerId,
      start_date: input.startDate,
      end_date: input.endDate,
      total_amount: totalAmount,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !booking) {
    if (isExclusionViolation(insertError)) {
      return {
        success: false,
        message: "These dates are no longer available for this equipment",
        data: null,
      };
    }

    console.error(
      "booking.service.createBooking: insert failed",
      insertError
    );
    return {
      success: false,
      message: "Could not create booking, please try again",
      data: null,
    };
  }

  await notificationService.createNotification({
    userId: equipment.owner_id,
    bookingId: booking.id,
    message: "A farmer requested a booking for your equipment.",
  });

  return {
    success: true,
    message: "Booking requested",
    data: booking,
  };
}

/**
 * Shared ownership + pending-only transition guard for approve/reject.
 * Server-enforced independent of any UI hiding of the buttons (T-05-03,
 * T-05-04) — verifies the booking's equipment is owned by `ownerId` and
 * that its *current* status is exactly 'pending' before allowing either
 * transition.
 */
async function getOwnedPendingBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  ownerId: string
): Promise<
  | { ok: true; booking: BookingWithEquipment }
  | { ok: false; message: string }
> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, equipments(id, title, owner_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return { ok: false, message: "Booking not found" };
  }

  const typedBooking = booking as BookingWithEquipment;

  if (typedBooking.equipments?.owner_id !== ownerId) {
    return { ok: false, message: "You do not have access to this booking" };
  }

  if (typedBooking.status !== "pending") {
    return { ok: false, message: PENDING_ONLY_GUARD_MESSAGE };
  }

  return { ok: true, booking: typedBooking };
}

/**
 * Approves a pending booking. Hardcodes the target status internally —
 * no caller ever supplies an arbitrary target status string (T-05-04).
 */
export async function approveBooking(
  bookingId: string,
  ownerId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();

  const guard = await getOwnedPendingBooking(supabase, bookingId, ownerId);
  if (!guard.ok) {
    return { success: false, message: guard.message, data: null };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "approved" })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error(
      "booking.service.approveBooking: update failed",
      updateError
    );
    return {
      success: false,
      message: "Could not approve booking, please try again",
      data: null,
    };
  }

  await notificationService.createNotification({
    userId: updated.farmer_id,
    bookingId: updated.id,
    message: "Your booking request was approved.",
  });

  return {
    success: true,
    message: "Booking approved",
    data: updated,
  };
}

/**
 * Rejects a pending booking. Mirrors approveBooking with the same
 * ownership + pending-only guard, hardcoding 'rejected' internally.
 */
export async function rejectBooking(
  bookingId: string,
  ownerId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();

  const guard = await getOwnedPendingBooking(supabase, bookingId, ownerId);
  if (!guard.ok) {
    return { success: false, message: guard.message, data: null };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error(
      "booking.service.rejectBooking: update failed",
      updateError
    );
    return {
      success: false,
      message: "Could not reject booking, please try again",
      data: null,
    };
  }

  await notificationService.createNotification({
    userId: updated.farmer_id,
    bookingId: updated.id,
    message: "Your booking request was rejected.",
  });

  return {
    success: true,
    message: "Booking rejected",
    data: updated,
  };
}

/**
 * Booking history for a farmer's own dashboard, joined with equipment
 * title for display.
 */
export async function getBookingsForFarmer(
  farmerId: string
): Promise<ServiceResult<BookingWithEquipment[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, equipments(id, title, owner_id)")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "booking.service.getBookingsForFarmer: query failed",
      error
    );
    return {
      success: false,
      message: "Could not load your bookings.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Bookings loaded",
    data: data as BookingWithEquipment[],
  };
}

/**
 * Incoming booking requests + active bookings for an owner's dashboard,
 * scoped via a join through equipments.owner_id, joined with equipment
 * title and the farmer's full_name for display.
 */
export async function getBookingsForOwner(
  ownerId: string
): Promise<ServiceResult<BookingWithEquipmentAndFarmer[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, equipments!inner(id, title, owner_id), users(full_name)")
    .eq("equipments.owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("booking.service.getBookingsForOwner: query failed", error);
    return {
      success: false,
      message: "Could not load booking requests.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Booking requests loaded",
    data: data as BookingWithEquipmentAndFarmer[],
  };
}

/**
 * Shared ownership guard for owner-only booking transitions
 * (approve, reject, complete). Verifies the booking's equipment is
 * owned by `ownerId`, regardless of booking status.
 */
async function getOwnedBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  ownerId: string
): Promise<
  | { ok: true; booking: BookingWithEquipment }
  | { ok: false; message: string }
> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, equipments(id, title, owner_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return { ok: false, message: "Booking not found" };
  }

  const typedBooking = booking as BookingWithEquipment;

  if (typedBooking.equipments?.owner_id !== ownerId) {
    return { ok: false, message: "You do not have access to this booking" };
  }

  return { ok: true, booking: typedBooking };
}

/**
 * Common status-transition logic used by complete/cancel. Reads the
 * current status from the DB (not from a stale argument) and applies
 * the transition if VALID_TRANSITIONS allows it.
 */
async function transitionBookingStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  newStatus: string,
  notificationUserId: string,
  notificationMessage: string
): Promise<ServiceResult<BookingRow>> {
  const { data: current, error: fetchError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !current) {
    return { success: false, message: "Booking not found", data: null };
  }

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot transition booking from ${current.status} to ${newStatus}`,
      data: null,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: newStatus } as Partial<BookingRow>)
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error(
      `booking.service.transitionBookingStatus: ${newStatus} failed`,
      updateError
    );
    return {
      success: false,
      message: `Could not update booking, please try again`,
      data: null,
    };
  }

  await notificationService.createNotification({
    userId: notificationUserId,
    bookingId: updated.id,
    message: notificationMessage,
  });

  return {
    success: true,
    message: `Booking ${newStatus}`,
    data: updated,
  };
}

/**
 * Completes an approved booking (owner-only). Notifies the farmer.
 */
export async function completeBooking(
  bookingId: string,
  ownerId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();
  const guard = await getOwnedBooking(supabase, bookingId, ownerId);
  if (!guard.ok) {
    return { success: false, message: guard.message, data: null };
  }

  return transitionBookingStatus(
    supabase,
    bookingId,
    "completed",
    guard.booking.farmer_id,
    "Your booking has been marked as completed."
  );
}

/**
 * Cancels a booking. The owner can cancel any owned booking (pending or
 * approved); the farmer can only cancel their own pending booking.
 */
export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, equipments(id, title, owner_id)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return { success: false, message: "Booking not found", data: null };
  }

  const typedBooking = booking as BookingWithEquipment;
  const isOwner = typedBooking.equipments?.owner_id === userId;
  const isFarmer = typedBooking.farmer_id === userId;

  if (!isOwner && !isFarmer) {
    return {
      success: false,
      message: "You do not have access to this booking",
      data: null,
    };
  }

  const otherUserId = isOwner
    ? typedBooking.farmer_id
    : typedBooking.equipments?.owner_id;

  const notificationMessage = isOwner
    ? "The owner has cancelled your booking."
    : "You have cancelled your booking request.";

  return transitionBookingStatus(
    supabase,
    bookingId,
    "cancelled",
    otherUserId ?? "",
    notificationMessage
  );
}
