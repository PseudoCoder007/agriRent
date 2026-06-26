# Phase 2: Equipment & Booking Lifecycle Deepening - Pattern Map

**Mapped:** 2026-06-26
**Files analyzed:** 11 (new/modified)
**Analogs found:** 0 exact / 11 (Phase 1 application code not yet written — see "No Analog Found")

## Important Caveat — Read First

Phase 1 (`01-walking-skeleton`) has **not yet produced application code** to copy from. Per `.planning/STATE.md`, Plan `01-01` is only partially complete (Tasks 1-2: Next.js scaffold + Supabase client wrappers + initial migration committed; Task 3 — pushing the schema to live Supabase — is blocked on `supabase login`). Plans `01-02` through `01-05` (auth, listing service, AI chat, booking+notification+dashboards) have not been executed at all.

**Consequence:** there are no `lib/services/*.ts`, `app/actions/*.ts`, route-group pages, or RLS-consuming service functions in this repo yet for Phase 2 to copy from. This PATTERNS.md instead maps Phase 2 files to:
1. The one piece of real, committed code that already establishes a convention — the Supabase client wrappers (`src/lib/supabase/{server,client,admin}.ts`) and the RLS/migration style in `supabase/migrations/0001_init_schema.sql`.
2. The **prescribed architecture** from `.planning/research/ARCHITECTURE.md`, which is the authoritative source for service-layer/Server-Action conventions Phase 1 was supposed to establish and Phase 2 must now follow as if it had.

If Phase 1's remaining plans (01-02 through 01-05) complete before Phase 2 is planned/executed, **re-run this pattern-mapping pass** — real Phase 1 service/action files will then exist and should supersede the ARCHITECTURE.md-derived guidance below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `supabase/migrations/0002_phase2.sql` | migration | CRUD (DDL) | `supabase/migrations/0001_init_schema.sql` | exact (same author, same migration) |
| `src/lib/services/listing.service.ts` (edit/delete additions) | service | CRUD | none yet — prescribed in ARCHITECTURE.md `lib/services/listing.service.ts` | spec-match only |
| `src/lib/services/favorite.service.ts` | service | CRUD | prescribed sibling: `lib/services/notification.service.ts` (simple single-table service, per ARCHITECTURE.md) | spec-match only |
| `src/lib/services/booking.service.ts` (completed/cancelled transitions) | service | event-driven (state machine) | prescribed: same file's existing approve/reject transition logic from Plan 01-05 (not yet written) | spec-match only |
| `src/app/actions/listing.actions.ts` (edit/delete actions) | route (Server Action) | request-response | prescribed: `app/actions/booking.actions.ts` pattern shown in ARCHITECTURE.md lines 140-146 | spec-match only |
| `src/app/actions/favorite.actions.ts` | route (Server Action) | request-response | same as above | spec-match only |
| `src/app/actions/booking.actions.ts` (complete/cancel actions) | route (Server Action) | request-response | prescribed pattern, ARCHITECTURE.md lines 140-146, 201-205 | spec-match only |
| `src/lib/validations/listing.schema.ts` (edit schema) | utility (Zod schema) | transform | none yet — prescribed `lib/validations/` dir, ARCHITECTURE.md line 128 | spec-match only |
| `src/lib/validations/favorite.schema.ts` | utility (Zod schema) | transform | same as above | spec-match only |
| Browse page filter UI (`src/app/(farmer)/browse/page.tsx` or equivalent) | component | request-response | none yet — Phase 1 Plan 01-03 (listing browse) not built | no analog |
| Favorite toggle UI component | component | event-driven (client interaction → Server Action) | none yet | no analog |

## Pattern Assignments

### `supabase/migrations/0002_phase2.sql` (migration, CRUD/DDL)

**Analog:** `supabase/migrations/0001_init_schema.sql` (this is a real, strong analog — same project, same migration conventions, authored 2026-06-26)

**Header/comment convention** (lines 1-7):
```sql
-- AgriRent Phase 1 walking-skeleton schema
-- Tables: users, equipments, equipment_images, bookings, notifications
-- Every CREATE TABLE is immediately followed by ENABLE ROW LEVEL SECURITY.
-- Cross-table/role checks route through SECURITY DEFINER LANGUAGE plpgsql
-- helper functions (never a direct subquery into another RLS-protected
-- table) to avoid the infinite-recursion failure mode documented in
-- research/PITFALLS.md Pitfall 1.
```
Copy this header style for the Phase 2 migration: state which tables/columns are added and which existing RLS-recursion-avoidance rule is still being honored.

**New table pattern to copy for `favorites`** — follow the `equipment_images` shape (simple child table owned by a user, RLS keyed off ownership) (lines 113-133):
```sql
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
```
For `favorites(id, farmer_id, equipment_id, created_at)`: SELECT/INSERT/DELETE policies should all use `USING (farmer_id = (select auth.uid()))` directly (no helper function needed — `farmer_id` is a direct column on the table itself, same pattern as the `bookings` table's farmer-row policies below). Add a `UNIQUE (farmer_id, equipment_id)` constraint so a farmer can't favorite the same equipment twice — this is the Phase 2 equivalent of the `bookings_no_overlap` EXCLUDE constraint: a DB-level guarantee, not just an app-level check.

**Booking-status enum already supports completed/cancelled** — no enum change needed (line 15):
```sql
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
```
Phase 2 only adds the *service-layer state machine* that allows transitioning into these values; the schema/enum work is already done in Phase 1.

**RLS ownership-check pattern to reuse for equipment edit/delete** (lines 102-108, already exists — no new policy needed, but the service layer must rely on it):
```sql
CREATE POLICY "equipments update own as owner" ON public.equipments
  FOR UPDATE
  USING (owner_id = (select auth.uid()) AND public.is_owner());

CREATE POLICY "equipments delete own as owner" ON public.equipments
  FOR DELETE
  USING (owner_id = (select auth.uid()) AND public.is_owner());
```
These policies already exist from Phase 1's migration — Phase 2's `listing.service.ts` edit/delete functions don't need new RLS, they need to call `.update()`/`.delete()` through the RLS-respecting server client (`lib/supabase/server.ts`) and trust Postgres to reject cross-owner attempts (return `{success: false}` on the resulting permission-denied error, never a raw 500 — see Shared Patterns below).

**Booking status transition guard pattern** — extend the existing EXCLUDE constraint's `WHERE` clause reasoning (lines 150-154) to the new transitions:
```sql
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'approved'));
```
No migration change needed here either — `completed`/`cancelled` bookings are already excluded from the overlap check by this `WHERE` clause. Phase 2's job is purely the service-layer state machine (see below), not a schema change.

---

### `src/lib/services/*.ts` (service layer — listing edit/delete, favorites, booking transitions)

**No real analog exists yet.** Follow the prescribed structure from `.planning/research/ARCHITECTURE.md`:

**Service signature convention** (ARCHITECTURE.md lines 66-70, 102-108):
```
lib/services/{auth,listing,booking,review,notification}.ts
each function returns {success, message, data}
```
Apply this to the two new/extended services:
- `lib/services/listing.service.ts` — add `updateListing(equipmentId, ownerId, data)` and `deleteListing(equipmentId, ownerId)`, both returning `{success, message, data}`, both calling the RLS-respecting server client so a cross-owner attempt fails at the database layer (caught and translated, not surfaced raw).
- `lib/services/favorite.service.ts` (new file) — `addFavorite(farmerId, equipmentId)`, `removeFavorite(farmerId, equipmentId)`, `listFavorites(farmerId)`, same `{success, message, data}` shape.
- `lib/services/booking.service.ts` — add `markCompleted(bookingId, ownerId)` and `markCancelled(bookingId, actorId)`. Must re-check **current status** before allowing the transition (state-machine guard), exactly as ARCHITECTURE.md specifies for the existing approve/reject logic:

**State machine guard pattern** (ARCHITECTURE.md line 201-205, conceptual — to be coded for the first time in Phase 1's 01-05, then extended in Phase 2):
```
booking.service.ts: validates current status is 'pending' before transition (state machine guard)
```
Phase 2 extension: `markCompleted` should only succeed if current status is `approved`; `markCancelled` should only succeed from `pending` or `approved` (never from `completed`, `rejected`, or already `cancelled`). Reject with `{success: false, message: "..."}` on an invalid transition — never let the client dictate the target status directly without this guard.

**Price/server-trust precedent to mirror** (ARCHITECTURE.md line 249):
```
Server Action/service layer recomputes total_amount from the equipment's
stored rate every time, and status transitions are only ever set by
server-side logic that checks the current status before allowing a
transition — never accepts an arbitrary target status from the client.
```
This is the same trust boundary Phase 2's completed/cancelled transitions must honor.

---

### `src/app/actions/*.actions.ts` (Server Actions — listing edit/delete, favorite toggle, booking complete/cancel)

**No real analog exists yet.** Prescribed pattern (ARCHITECTURE.md lines 140-146):
```typescript
// app/actions/booking.actions.ts
export async function createBooking(...) {
  const parsed = bookingSchema.parse(input) // or safeParse
  const result = await bookingService.create(parsed) // service layer owns conflict + price logic
  revalidatePath(...)
  return result // {success, message, data}
}
```
Apply identically to:
- `app/actions/listing.actions.ts` → `updateListing()`, `deleteListing()` — thin wrappers: parse with Zod, call `listingService`, `revalidatePath` the owner's listing pages and the public browse page, return the service's `{success, message, data}` untouched.
- `app/actions/favorite.actions.ts` (new) → `toggleFavorite()` — parse equipmentId, call `favoriteService`, `revalidatePath` the favorites page.
- `app/actions/booking.actions.ts` → `markBookingCompleted()`, `markBookingCancelled()` — same thin-wrapper shape, `revalidatePath` both farmer and owner dashboards.

**Action layer responsibility boundary** (ARCHITECTURE.md line 285):
```
Server Actions ↔ Service layer: Direct function call within the same
server runtime. Service layer is where Zod validation + business rules +
Supabase calls happen; Actions stay thin (parse input, call service,
revalidate).
```
Keep all new Server Actions thin — validation/business logic belongs in the service file, not the action file, matching the existing project convention even though no code yet demonstrates it.

---

### `src/lib/validations/*.schema.ts` (Zod schemas — listing edit, favorite)

**No analog exists yet.** Prescribed (ARCHITECTURE.md line 128):
```
lib/validations/: Centralizing Zod schemas lets both Server Actions and
the future API routes import the same schema, and lets you derive
TypeScript types with z.infer instead of hand-duplicating types.
```
- `lib/validations/listing.schema.ts` should add an `updateListingSchema` (likely a `.partial()` variant of whatever `createListingSchema` Plan 01-03 will define) — re-validate category against the same fixed enum from CONTEXT.md D-03 (`Tractor`, `Harvester`, `Plough`, `Rotavator`, `Sprayer`, `Other`).
- `lib/validations/favorite.schema.ts` (new) — minimal: `{ equipmentId: z.string().uuid() }`.

---

### Browse page filters / favorite toggle UI (components)

**No analog exists yet** — Phase 1's browse page (Plan 01-03) and dashboard pages (Plan 01-05) haven't been built. These should follow:
- CLAUDE.md: Server Components first; the browse page with filters is a Server Component reading `searchParams` for category/location and passing them to `listingService.list(filters)`; only the favorite-toggle button itself needs to be a Client Component (it calls a Server Action on click — `'use client'` + `useTransition`/`useFormStatus`, no manual fetch).
- Category filter values must reuse the exact enum from CONTEXT.md D-03 (already encoded as Postgres enum `equipment_category` in the migration) — do not invent new category strings.

## Shared Patterns

### Supabase Client Selection (real, existing code — strong analog)
**Source:** `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/admin.ts`
**Apply to:** All new service files and any new Server/Client Components

```typescript
// src/lib/supabase/server.ts — use inside services/Server Actions, RLS-respecting
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() {...}, setAll(cookiesToSet) {...} } }
  );
}
```
```typescript
// src/lib/supabase/admin.ts — service-role, RLS-bypassing, server-only
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never be called from the browser...");
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```
Rule for Phase 2: `listing.service.ts` and `favorite.service.ts` must use `createClient()` (RLS-respecting) exclusively — there is no legitimate reason for edit/delete/favorite operations to bypass RLS. Only `notification.service.ts` (writing a notification on behalf of another user) should ever import `createAdminClient()`. Booking completion/cancellation also stays on the RLS-respecting client — the existing `bookings update as owning owner` policy already permits the owner to update status.

### RLS Recursion Avoidance (existing migration convention — must extend, not bypass)
**Source:** `supabase/migrations/0001_init_schema.sql` lines 30-67
**Apply to:** Any new RLS policy in the Phase 2 migration (favorites table)

```sql
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
```
For `favorites`, no new SECURITY DEFINER helper is needed since `farmer_id` is a direct column (same as `bookings.farmer_id`), but if any future Phase 2 policy needs to check "is this equipment mine" from a different table, reuse `owns_equipment()` rather than writing a new subquery — never subquery directly into another RLS-protected table from within a policy (this is the documented recursion failure mode in `research/PITFALLS.md` Pitfall 1).

### Server-Computed Trust Boundary (architectural rule, not yet coded but mandatory)
**Source:** `.planning/research/ARCHITECTURE.md` line 249, `CLAUDE.md` "Booking integrity" section
**Apply to:** `booking.service.ts` completed/cancelled transitions, `listing.service.ts` edit (owner_id must never be client-settable)

```
Server Action/service layer recomputes total_amount from the equipment's
stored rate every time, and status transitions are only ever set by
server-side logic that checks the current status before allowing a
transition — never accepts an arbitrary target status from the client.
```
Phase 2 corollary: `updateListing()` must never accept `owner_id` from client input (always derive from the authenticated session); `markCompleted`/`markCancelled` must never accept an arbitrary `status` field from the client — only expose specific named functions per transition, each internally hard-coding its allowed source/target statuses.

### Response Shape (project-wide convention, CLAUDE.md)
**Source:** CLAUDE.md "Error Handling" section
**Apply to:** Every new service function and Server Action

```
Every API/Server Action returns { success, message, data }.
Never throw raw database errors to the client.
```
Postgres constraint violations (e.g., a hypothetical duplicate-favorite `UNIQUE` violation) must be caught in the service layer and translated to `{success: false, message: "..."}`, matching the existing documented handling of the `bookings_no_overlap` EXCLUDE violation (ARCHITECTURE.md line 168).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/services/listing.service.ts` (edit/delete) | service | CRUD | Phase 1 Plan 01-03 (listing service create/browse) not yet executed — no base file to extend |
| `src/lib/services/favorite.service.ts` | service | CRUD | New table/service, no Phase 1 precedent; closest conceptual sibling (`notification.service.ts`) also not yet written |
| `src/lib/services/booking.service.ts` (completed/cancelled) | service | event-driven | Phase 1 Plan 01-05 (booking + approve/reject state machine) not yet executed |
| `src/app/actions/listing.actions.ts`, `favorite.actions.ts`, `booking.actions.ts` | route (Server Action) | request-response | No Server Action files exist in the repo yet at all |
| `src/lib/validations/listing.schema.ts`, `favorite.schema.ts` | utility | transform | No `lib/validations/` directory exists yet in the repo |
| Browse page filter UI, favorite toggle UI | component | request-response / event-driven | Phase 1's browse page and dashboards not yet built; only generic Shadcn primitives (`button.tsx`, `card.tsx`, etc.) exist under `src/components/ui/` |

**Recommendation to planner:** Treat ARCHITECTURE.md's prescribed file tree and code excerpts (reproduced above) as the de facto analog, but flag in each Phase 2 plan that the *first* file in each pair (e.g., `listing.service.ts`'s create function, `booking.service.ts`'s approve/reject function) must exist from Phase 1 before the Phase 2 edit/delete or completed/cancelled functions can be appended to it. If Phase 1 plans 01-02 through 01-05 are still incomplete when Phase 2 execution begins, the planner should sequence Phase 2 plans to depend on Phase 1 completion, or explicitly create the base service/action files as part of the first Phase 2 plan rather than assuming they exist.

## Metadata

**Analog search scope:** `src/`, `supabase/migrations/`, `.planning/research/`, `.planning/phases/01-walking-skeleton/`
**Files scanned:** 19 TypeScript/TSX files (all of `src/`), 1 SQL migration, 5 research docs, 1 Phase 1 CONTEXT.md, ROADMAP.md, STATE.md
**Pattern extraction date:** 2026-06-26
