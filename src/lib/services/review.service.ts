import { createClient } from "@/lib/supabase/server";
import type { CreateReviewInput } from "@/lib/validations/review.schema";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type ReviewRow = Tables<"reviews">;

export type ReviewWithFarmer = ReviewRow & {
  users: Pick<Tables<"users">, "full_name"> | null;
};

/**
 * Creates a review for a completed booking. The RLS policy
 * ("reviews insert own completed") is the authoritative guard — it
 * rejects inserts where the booking isn't completed or isn't owned by
 * the caller. This service function adds a pre-check for a better UX
 * error message, but the DB is the source of truth.
 */
export async function createReview(
  input: CreateReviewInput,
  farmerId: string
): Promise<ServiceResult<ReviewRow>> {
  const supabase = await createClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("status, equipment_id")
    .eq("id", input.bookingId)
    .eq("farmer_id", farmerId)
    .single();

  if (bookingError || !booking) {
    return {
      success: false,
      message: "Booking not found.",
      data: null,
    };
  }

  if (booking.status !== "completed") {
    return {
      success: false,
      message:
        "You can only review a booking after it has been completed.",
      data: null,
    };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", input.bookingId)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: "You have already reviewed this booking.",
      data: null,
    };
  }

  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      equipment_id: booking.equipment_id,
      farmer_id: farmerId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .select()
    .single();

  if (insertError || !review) {
    console.error("review.service.createReview: insert failed", insertError);
    return {
      success: false,
      message: "Could not submit review, please try again.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Review submitted.",
    data: review,
  };
}

/**
 * Returns reviews for a piece of equipment, newest first, joined with
 * the reviewer's full name.
 */
export async function getReviewsForEquipment(
  equipmentId: string
): Promise<ServiceResult<ReviewWithFarmer[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, users(full_name)")
    .eq("equipment_id", equipmentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "review.service.getReviewsForEquipment: query failed",
      error
    );
    return {
      success: false,
      message: "Could not load reviews.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Reviews loaded.",
    data: data as ReviewWithFarmer[],
  };
}

/**
 * Finds a completed booking for this farmer+equipment that has not yet
 * been reviewed. Returns null if the farmer is ineligible.
 */
export async function getEligibleBooking(
  farmerId: string,
  equipmentId: string
): Promise<ServiceResult<{ bookingId: string } | null>> {
  const supabase = await createClient();

  const { data: reviewed } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("farmer_id", farmerId)
    .eq("equipment_id", equipmentId);

  const reviewedIds = new Set(
    (reviewed ?? []).map((r) => r.booking_id)
  );

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("farmer_id", farmerId)
    .eq("equipment_id", equipmentId)
    .eq("status", "completed");

  if (error) {
    console.error("review.service.getEligibleBooking: query failed", error);
    return { success: false, message: "Could not check eligibility.", data: null };
  }

  const eligible = bookings?.find((b) => !reviewedIds.has(b.id)) ?? null;

  return {
    success: true,
    message: "OK",
    data: eligible ? { bookingId: eligible.id } : null,
  };
}

/**
 * Returns the average rating for a piece of equipment, or null if no
 * reviews exist yet.
 */
export async function getAverageRating(
  equipmentId: string
): Promise<ServiceResult<number | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("equipment_id", equipmentId);

  if (error) {
    console.error("review.service.getAverageRating: query failed", error);
    return {
      success: false,
      message: "Could not load rating.",
      data: null,
    };
  }

  if (data.length === 0) {
    return { success: true, message: "No reviews yet.", data: null };
  }

  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / data.length) * 10) / 10;

  return { success: true, message: "Rating loaded.", data: avg };
}
