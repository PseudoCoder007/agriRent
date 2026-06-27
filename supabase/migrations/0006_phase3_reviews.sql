-- Phase 3 reviews schema foundation.
-- New: reviews table (with RLS), Realtime publication for notifications.
-- This migration is purely additive — safe to run after 0005_phase2_schema.sql.

-- 1. reviews — one review per completed booking from the farmer who made it.
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Farmer inserts a review only for their own completed booking.
CREATE POLICY "reviews insert own completed" ON public.reviews
  FOR INSERT
  WITH CHECK (
    farmer_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
        AND farmer_id = (select auth.uid())
        AND status = 'completed'
    )
  );

-- Everyone can read reviews (shown on equipment detail pages).
CREATE POLICY "reviews select public" ON public.reviews
  FOR SELECT
  USING (true);

-- 2. Enable Realtime for the notifications table so the client can subscribe
--    to live notification inserts without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
