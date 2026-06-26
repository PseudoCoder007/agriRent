import { z } from "zod";

/**
 * Booking creation payload. Deliberately `.strict()` so any extra key
 * (most importantly `total_amount` or `status`) causes a parse failure
 * instead of being silently stripped — an explicit, loud signal if a
 * tampered payload is ever sent (see T-05-01 in 01-05-PLAN.md). The server
 * always computes `total_amount` from the equipment's stored rate inside
 * booking.service.ts; it is never accepted as input here.
 */
export const createBookingSchema = z
  .object({
    equipmentId: z.string().uuid(),
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Phase 1's booking status state machine is intentionally narrow: a
 * pending booking may only move to approved or rejected. completed/
 * cancelled are explicit Phase 1 deferrals (see SKELETON.md). This schema
 * exists as a guard reference for the two valid transitions — the actual
 * enforcement (current-status check before transitioning) lives in
 * booking.service.ts's approveBooking/rejectBooking, not here.
 */
export const bookingStatusTransitionSchema = z.enum(["approved", "rejected"]);

export type BookingStatusTransition = z.infer<
  typeof bookingStatusTransitionSchema
>;
