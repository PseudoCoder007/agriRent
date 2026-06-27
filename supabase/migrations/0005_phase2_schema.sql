-- AgriRent Phase 2 schema additions
-- New: favorites table (with RLS), equipments.deleted_at (soft-delete),
--      bookings status-transition BEFORE UPDATE trigger (defense-in-depth).
-- This migration is purely additive — it creates new objects and adds columns;
-- it never modifies or drops an existing migration's objects, policies, or
-- constraints.

-- 1. favorites — junction table for farmer-to-equipment saved items.
--    ON DELETE CASCADE on both FKs: if a user or equipment is hard-deleted
--    by a future cleanup process, stale favorite rows vanish automatically.
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farmer_id, equipment_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Self-ownership policies — no cross-table helper function needed since the
-- farmer_id check is a direct `auth.uid()` comparison on the same row.
CREATE POLICY "favorites select own" ON public.favorites
  FOR SELECT
  USING (farmer_id = (select auth.uid()));

CREATE POLICY "favorites insert own" ON public.favorites
  FOR INSERT
  WITH CHECK (farmer_id = (select auth.uid()));

CREATE POLICY "favorites delete own" ON public.favorites
  FOR DELETE
  USING (farmer_id = (select auth.uid()));

-- 2. equipments — soft-delete column. Nullable, NULL means "not deleted".
--    Every public read path must filter WHERE deleted_at IS NULL (enforced
--    at the service layer in Plan 02-02, not via RLS — the existing
--    RLS policies from 0001_init_schema.sql are unchanged).
ALTER TABLE public.equipments ADD COLUMN deleted_at timestamptz;

-- 3. Booking status transition guard — BEFORE UPDATE trigger that rejects
--    any OLD.status -> NEW.status jump not in the explicit allow-list.
--    This is a secondary enforcement layer; the primary Layer is the
--    service-level VALID_TRANSITIONS check in booking.service.ts (Plan 02-04).
--    LANGUAGE plpgsql is required (never LANGUAGE sql) to avoid Postgres
--    inlining which would strip the trigger context — consistent with the
--    SECURITY DEFINER helper convention established in 0001_init_schema.sql.
CREATE OR REPLACE FUNCTION public.enforce_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- No-op update to other columns (e.g. notification-related metadata in a
  -- future phase) — not a status transition, always allowed.
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Allowed forward transitions:
  --   pending -> approved, rejected, cancelled
  --   approved -> completed, cancelled
  -- All other jumps (e.g. pending -> completed, rejected -> approved) are
  -- rejected. The service-layer VALID_TRANSITIONS table (Plan 02-04) mirrors
  -- this exactly — both layers must agree.
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'cancelled'))
     OR (OLD.status = 'approved' AND NEW.status IN ('completed', 'cancelled'))
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status;
END;
$$;

CREATE TRIGGER bookings_status_transition_guard
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_status_transition();
