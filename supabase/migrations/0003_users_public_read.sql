-- AgriRent Phase 1 Plan 03 — public profile read policy on users.
--
-- Rule 2 fix: 0001_init_schema.sql scoped `users` SELECT to own-row-only
-- ((select auth.uid()) = id), which silently breaks this plan's own stated
-- truth ("a farmer can open an equipment detail page showing ... owner")
-- because any join from equipments/equipment_images to users for another
-- user's full_name returns no row under RLS — the owner's name would
-- always render as null/missing on the browse and detail pages. Add an
-- authenticated-read policy so any signed-in user can read another user's
-- profile row — required for a marketplace listing to ever display
-- "Owner: <name>". Email is also exposed by this broader policy (RLS is
-- row-level, not column-level) but is never rendered in any
-- equipment-facing UI added in this phase.
CREATE POLICY "users select any authenticated (public profile fields)" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);
