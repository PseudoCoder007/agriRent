-- AgriRent Phase 1 walking-skeleton schema
-- Tables: users, equipments, equipment_images, bookings, notifications
-- Every CREATE TABLE is immediately followed by ENABLE ROW LEVEL SECURITY.
-- Cross-table/role checks route through SECURITY DEFINER LANGUAGE plpgsql
-- helper functions (never a direct subquery into another RLS-protected
-- table) to avoid the infinite-recursion failure mode documented in
-- research/PITFALLS.md Pitfall 1.

-- 1. Extension required for the bookings EXCLUDE constraint (range overlap).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Enum types.
CREATE TYPE user_role AS ENUM ('farmer', 'owner');
CREATE TYPE equipment_category AS ENUM ('Tractor', 'Harvester', 'Plough', 'Rotavator', 'Sprayer', 'Other');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- 3. users — server-controlled role table. Role is NEVER read from
--    auth.users.user_metadata (client-editable); this table is the only
--    source of truth for role-based authorization.
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY DEFINER helper functions. LANGUAGE plpgsql is required —
--    Postgres inlines simple LANGUAGE sql functions, which silently strips
--    the SECURITY DEFINER context and reintroduces the recursion bug.
CREATE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (public.current_user_role() = 'owner');
END;
$$;

CREATE FUNCTION public.owns_equipment(p_equipment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.equipments
    WHERE id = p_equipment_id AND owner_id = auth.uid()
  );
END;
$$;

-- 5. RLS policies on users. No policy here may subquery users itself.
CREATE POLICY "users select own row" ON public.users
  FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "users update own row" ON public.users
  FOR UPDATE
  USING ((select auth.uid()) = id);

-- 6. equipments
CREATE TABLE public.equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  description text,
  category equipment_category NOT NULL,
  rate numeric(10,2) NOT NULL,
  rate_unit text NOT NULL DEFAULT 'day',
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipments select authenticated" ON public.equipments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "equipments insert own as owner" ON public.equipments
  FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()) AND public.is_owner());

CREATE POLICY "equipments update own as owner" ON public.equipments
  FOR UPDATE
  USING (owner_id = (select auth.uid()) AND public.is_owner());

CREATE POLICY "equipments delete own as owner" ON public.equipments
  FOR DELETE
  USING (owner_id = (select auth.uid()) AND public.is_owner());

-- 7. equipment_images — ownership check routed through owns_equipment()
--    rather than a direct subquery into equipments, to avoid cross-table
--    RLS recursion risk.
CREATE TABLE public.equipment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_images select authenticated" ON public.equipment_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "equipment_images insert by owner" ON public.equipment_images
  FOR INSERT
  WITH CHECK (public.owns_equipment(equipment_id));

CREATE POLICY "equipment_images delete by owner" ON public.equipment_images
  FOR DELETE
  USING (public.owns_equipment(equipment_id));

-- 8. bookings — EXCLUDE constraint is the authoritative double-booking
--    guard (database-level, not application check-then-insert).
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id),
  farmer_id uuid NOT NULL REFERENCES public.users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'approved'));

CREATE POLICY "bookings select own as farmer" ON public.bookings
  FOR SELECT
  USING (farmer_id = (select auth.uid()));

CREATE POLICY "bookings insert own as farmer" ON public.bookings
  FOR INSERT
  WITH CHECK (farmer_id = (select auth.uid()));

CREATE POLICY "bookings select as owning owner" ON public.bookings
  FOR SELECT
  USING (public.owns_equipment(equipment_id));

CREATE POLICY "bookings update as owning owner" ON public.bookings
  FOR UPDATE
  USING (public.owns_equipment(equipment_id));

-- 9. notifications — regular users get no INSERT policy; inserts happen
--    only via the service-role admin client (see lib/supabase/admin.ts and
--    research/ARCHITECTURE.md Pattern 3), so default-deny on INSERT for the
--    authenticated role is intentional, not an oversight.
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  booking_id uuid REFERENCES public.bookings(id),
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications select own" ON public.notifications
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "notifications update own" ON public.notifications
  FOR UPDATE
  USING (user_id = (select auth.uid()));

-- 10. Deliberately NOT created in Phase 1 (deferred per SKELETON.md
--     "Explicitly Deferred"): reviews, payments, favorites tables. These
--     are scoped to later phases (reviews are hard-blocked on `completed`
--     bookings existing, which Phase 1 does not produce; payments and
--     favorites are out of v1 scope per PROJECT.md).
