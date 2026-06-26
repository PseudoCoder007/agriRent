# Phase 2: Equipment & Booking Lifecycle Deepening - Research

**Researched:** 2026-06-26
**Domain:** Postgres RLS extension (favorites junction table), server-enforced status state machines, Next.js 15 App Router server-side filtering, soft-delete vs hard-delete for FK-referenced rows
**Confidence:** HIGH

## Summary

Phase 2 is a pure extension of the Phase 1 foundation — no new npm packages, no new architectural layers, just more tables, more service functions, and more RLS policies following the exact patterns Phase 1 already established (and which Phase 1 has not yet executed past Plan 01-01: the live schema has not even been pushed to Supabase yet, and zero application code exists beyond client wrappers and Shadcn primitives). This research assumes Phase 1's plans 01-02 through 01-05 will be complete — including `owns_equipment()`, `is_owner()`, `current_user_role()` SECURITY DEFINER helpers and the `bookings` table with its `EXCLUDE` constraint and `booking_status` enum — by the time Phase 2 executes.

Four things need deciding, all of which this research resolves: (1) the `favorites` table needs a composite unique key on `(farmer_id, equipment_id)` and a single `is_owner()`-style helper is not needed — its RLS policies can use direct `auth.uid() = farmer_id` ownership checks since the table only ever references the current user's own id, no cross-table role lookup required; (2) booking status transitions need a single source of truth — extend the existing service-layer "check current status before mutating" pattern from `booking.service.ts` rather than introducing a database trigger, to stay consistent with how `approveBooking`/`rejectBooking` already work; (3) equipment delete must be a soft delete (`deleted_at` or `is_active` flag) because `bookings.equipment_id` has a `REFERENCES public.equipments(id)` foreign key with no `ON DELETE CASCADE`/`SET NULL`, so a hard delete on equipment with booking history will either fail the FK constraint or silently orphan booking display data; (4) category/location filtering belongs entirely server-side via `searchParams` (a Promise in Next.js 15, must be `await`-ed) passed into `listingService.getAllEquipment(filters)`, which builds a Supabase query-builder chain (`.eq('category', ...)`, `.ilike('location', ...)`) — never client-side array filtering of an already-fetched full list, which would not scale and contradicts the project's server-side-validation posture.

**Primary recommendation:** Extend `listing.service.ts` and `booking.service.ts` (do not create new service files) with new functions following Phase 1's exact `{success, message, data}` + Zod-schema-first + ownership-reverification pattern; add one new `favorites.service.ts` for the new domain entity; add one new migration file `0002_phase2_schema.sql` (never edit `0001_init_schema.sql` after it has been applied) containing the `favorites` table, the `equipments.deleted_at` soft-delete column, and a `booking_status_transitions` guard implemented as a `BEFORE UPDATE` Postgres trigger as a second, database-level enforcement layer behind the service-layer check (defense in depth, mirroring how the `EXCLUDE` constraint backs up the service-layer pre-check for bookings).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| EQUIP-02 | Owner can edit their own equipment listings | Pattern 1 (Architecture Patterns) + Pitfall 3/4 equivalents for ownership re-verification; `updateEquipmentSchema` (partial schema, excludes `ownerId`) mirrors the existing `createEquipmentSchema` pattern from Phase 1's `01-03-PLAN.md` |
| EQUIP-03 | Owner can delete their own equipment listings | Pattern 2 (soft delete via `deleted_at`) — resolves the FK conflict with `bookings.equipment_id` that a hard delete would create; Common Pitfalls Pitfall 2 (soft-delete filter must apply to all three read paths) |
| EQUIP-05 | Farmer can filter equipment by category and location | Pattern 1 (server-side `searchParams` filtering via Supabase query builder); Alternatives Considered (single-select `Select` for category, `ILIKE` substring match for location, per Assumption A4/A5) |
| EQUIP-07 | Farmer can save/favorite equipment for later | New `favorites` table + RLS (Code Examples), new `favorites.service.ts` (`toggleFavorite`, `getFavoritesForFarmer`), new `Toggle` Shadcn component (Standard Stack) |
| BOOK-05 (completed/cancelled half) | Booking status reaches completed/cancelled with server-enforced transitions | Pattern 3 (service-layer `VALID_TRANSITIONS` guard, extending Phase 1's pending→approved/rejected guard) + Pattern 4 (DB-level `BEFORE UPDATE` trigger as defense-in-depth); Common Pitfalls Pitfall 3/4; Open Questions 1/2 flag the exact actor/timing rules needing a CONTEXT.md decision before planning locks the transition table |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Equipment edit/delete ownership check | API/Backend (Server Action + service layer) | Database (RLS `UPDATE`/`DELETE` policy via `owns_equipment()`) | Service layer is the first gate (friendly error message); RLS is the actual authorization boundary that holds even if a Server Action is bypassed by a direct Supabase client call |
| Equipment soft-delete flag | Database / Storage | API/Backend (query filter) | `deleted_at`/`is_active` lives in Postgres; every read path (`getAllEquipment`, `getEquipmentById`, `getEquipmentByOwner`) must filter it server-side, never client-side |
| Category/location filtering | API/Backend (Supabase query builder) | Browser/Client (URL `searchParams` state) | Filter *values* live in the URL (client-owned, shareable/bookmarkable), but the actual filtering query executes server-side in the Server Component via the service layer — never fetch-all-then-filter-in-the-browser |
| Favorites (save/list) | Database / API/Backend | Browser/Client (optimistic toggle UI) | Junction table + RLS is the source of truth; client only needs a fast toggle affordance with optimistic UI, real state always re-derived from the server on next load |
| Booking status transition guard (completed/cancelled) | API/Backend (service layer) | Database (trigger, defense-in-depth) | Primary enforcement is the service-layer "check current status, verify actor role" function (consistent with Phase 1's `approveBooking`/`rejectBooking`); a DB trigger is a secondary backstop, not the primary mechanism, to stay consistent with the codebase's existing pattern rather than introducing a second paradigm |

## Standard Stack

### Core

No new core libraries. Phase 2 uses exactly the stack already installed in `package.json` (Next.js 15.5.19, React 19.1.0, `@supabase/supabase-js@2.108.2`, `@supabase/ssr@0.12.0`, `zod@4.4.3`, `react-hook-form@7.80.0`, `@hookform/resolvers@5.4.0`, `date-fns@4.4.0`, `lucide-react@1.21.0`).

**Version verification (re-checked this session):** `npm view lucide-react version` → `1.21.0` (matches installed). `npm view date-fns version` → `4.4.0` (matches installed). [VERIFIED: npm registry] No version drift since Phase 1 was scaffolded.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Shadcn `Toggle` (not yet installed) | CLI-installed, no fixed version | Favorite heart-icon button affordance | `npx shadcn@latest add toggle` — needed for an accessible pressed/unpressed state for the favorite button, rather than hand-rolling a plain `<button>` with manual `aria-pressed` |
| Shadcn `AlertDialog` (not yet installed) | CLI-installed | Delete-confirmation modal before equipment delete | `npx shadcn@latest add alert-dialog` — a destructive action (even if soft-delete) should have a confirm step; `Dialog` (already installed) could be reused but `AlertDialog` is Shadcn's purpose-built component for destructive confirmations with built-in focus-trap/cancel semantics |
| Shadcn `Checkbox` (not yet installed, optional) | CLI-installed | Multi-select category filter, if Claude's Discretion lands on multi-category rather than single-category filtering | Only needed if the category filter is multi-select; a single-select `Select` (already installed) is the simpler default — see Open Questions |

**Installation:**
```bash
npx shadcn@latest add toggle alert-dialog
```

No `npm install` of any new dependency is required for Phase 2 — both additions above are Shadcn CLI-copied component source files (Radix-based, already-installed `radix-ui` package satisfies their peer dependency), not new npm packages.

### Alternatives Considered

| Recommended | Alternative | Tradeoff |
|-------------|-------------|----------|
| Service-layer status-transition guard (extend `booking.service.ts`) | Database trigger as the *sole* enforcement | A trigger-only approach is technically sufficient and arguably more bulletproof, but it introduces a second enforcement paradigm inconsistent with Phase 1's `approveBooking`/`rejectBooking`, which already implement the "check current status before transition" guard in TypeScript. Recommendation: service-layer is primary (consistency, easier to unit-test, friendly error messages), trigger is a secondary backstop only |
| Soft delete (`deleted_at` timestamp column) | Hard delete with `ON DELETE CASCADE` on `bookings.equipment_id` | Cascading the delete would silently destroy a farmer's booking history (their dashboard would show a booking referencing nothing, or the booking row itself would vanish) the moment an owner deletes a listing — unacceptable for a marketplace where booking history is a trust/audit record. Hard delete is only defensible if zero bookings ever reference the equipment, which would need a guard check anyway, at which point soft delete is strictly simpler |
| Plain `Select` for category filter (single-select) | Multi-select `Checkbox` group or `Combobox` | EQUIP-05 says "filter by category and by location," implying one category at a time is sufficient for v1 scope; multi-select adds query complexity (`IN (...)` clause) and UI complexity with no stated requirement driving it — defer unless CONTEXT.md / discuss-phase surfaces a specific need |
| `searchParams`-driven server-side filtering | Client-side `useState` + `.filter()` over an already-fetched full equipment list | Client-side filtering requires fetching the entire equipment table to the browser on every page load regardless of filter state, which won't scale past a few dozen rows and contradicts the "paginate lists, avoid unnecessary re-renders" CLAUDE.md performance convention; server-side filtering via the service layer also keeps the existing `getAllEquipment()` service-layer convention intact rather than bypassing it |

## Package Legitimacy Audit

**No new external packages are introduced in this phase.** Phase 2 only adds Shadcn CLI-copied component source files (`toggle`, `alert-dialog`), which are not separate npm dependencies — they copy source into `src/components/ui/` and rely on the already-installed, already-audited `radix-ui` package from Phase 1. No `npm install` of any new package name occurs, so the Package Legitimacy Gate's registry/SLOP/SUS check has nothing new to verify.

**Packages removed due to [SLOP] verdict:** none — no new packages proposed.
**Packages flagged as suspicious [SUS]:** none — no new packages proposed.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │     Browser (Farmer / Owner)         │
                    │  /browse?category=Tractor&location=  │
                    │  Pune  (URL state, shareable)         │
                    │  Heart-toggle button (optimistic UI)  │
                    │  Edit/Delete buttons (owner only)     │
                    │  Mark Completed/Cancelled buttons     │
                    └──────────────┬────────────────────────┘
                                   │ (1) GET with searchParams
                                   ▼
            ┌──────────────────────────────────────────────────┐
            │  Next.js 15 Server Component: /browse/page.tsx    │
            │  await searchParams -> { category, location }     │
            └──────────────────────┬─────────────────────────────┘
                                   │ (2) calls service, never raw query
                                   ▼
            ┌──────────────────────────────────────────────────┐
            │  listing.service.ts                                │
            │  getAllEquipment({ category?, location? })         │
            │   .eq('category', ...) .ilike('location', `%..%`)  │
            │   .is('deleted_at', null)   <- soft-delete filter   │
            └──────────────────────┬─────────────────────────────┘
                                   │ (3) RLS-respecting server client
                                   ▼
                    ┌───────────────────────────────┐
                    │   Postgres: public.equipments  │
                    │   RLS: SELECT where deleted_at  │
                    │   is null (or filter in query)  │
                    └───────────────────────────────┘

   --- Owner edit/delete path (separate flow) ---

  Owner clicks Edit/Delete on /owner/dashboard or /owner/equipment/[id]/edit
            │ (1) Server Action: updateEquipmentAction / deleteEquipmentAction
            ▼
  listing.service.ts: updateEquipment(id, input, ownerId) / softDeleteEquipment(id, ownerId)
            │ (2) re-verify ownership server-side: owns_equipment(id) equivalent check
            │     fetch equipment.owner_id, compare to ownerId param BEFORE any write
            ▼
  Postgres UPDATE ... WHERE id = $1   (RLS UPDATE policy is second independent gate)
            │
            ▼
  revalidatePath('/browse'), revalidatePath('/owner/dashboard')

   --- Booking terminal-state transition path ---

  Owner clicks "Mark Completed" (after rental period) | Farmer clicks "Cancel" (on own pending/approved booking)
            │ (1) Server Action: completeBookingAction(bookingId) | cancelBookingAction(bookingId)
            ▼
  booking.service.ts: completeBooking(bookingId, ownerId) | cancelBooking(bookingId, farmerId)
            │ (2) fetch booking, verify actor matches required role+ownership
            │     verify CURRENT status is in the allowed source-state set for this transition
            │     (e.g. completed only from 'approved'; cancelled only from 'pending'/'approved')
            ▼
  Postgres UPDATE bookings SET status = 'completed'|'cancelled' WHERE id = $1
            │  <- BEFORE UPDATE trigger re-validates OLD.status -> NEW.status is in the
            │     allowed-transitions table as a second, DB-level enforcement layer
            ▼
  notification.service.ts: createNotification(...) awaited before response
            │
            ▼
  revalidatePath on both dashboards

   --- Favorites path ---

  Farmer clicks heart icon on /browse card or /equipment/[id]
            │ (1) Server Action: toggleFavoriteAction(equipmentId)
            ▼
  favorites.service.ts: toggleFavorite(equipmentId, farmerId)
            │ (2) check existing row by (farmer_id, equipment_id); insert or delete
            ▼
  Postgres public.favorites   RLS: farmer_id = auth.uid() (no helper function needed —
                               no cross-table/role check, direct self-ownership)
            │
            ▼
  revalidatePath('/browse'), revalidatePath('/farmer/favorites')
```

### Recommended Project Structure

No new top-level folders. Additions land inside the existing Phase 1 structure:

```
src/
├── app/
│   ├── (owner)/
│   │   └── equipment/
│   │       ├── new/page.tsx              # Phase 1 — unchanged
│   │       └── [id]/edit/page.tsx        # NEW — owner equipment edit form
│   ├── (farmer)/
│   │   ├── browse/page.tsx               # MODIFIED — add searchParams filter UI
│   │   └── favorites/page.tsx            # NEW — saved equipment list (EQUIP-07 "find it again later")
│   └── actions/
│       ├── listing.actions.ts            # MODIFIED — add updateEquipmentAction, deleteEquipmentAction
│       ├── booking.actions.ts            # MODIFIED — add completeBookingAction, cancelBookingAction
│       └── favorites.actions.ts          # NEW — toggleFavoriteAction
├── lib/
│   ├── services/
│   │   ├── listing.service.ts            # MODIFIED — add updateEquipment, softDeleteEquipment, filters on getAllEquipment
│   │   ├── booking.service.ts            # MODIFIED — add completeBooking, cancelBooking
│   │   └── favorites.service.ts          # NEW — toggleFavorite, getFavoritesForFarmer, isFavorited
│   └── validations/
│       ├── equipment.schema.ts           # MODIFIED — add updateEquipmentSchema (partial, no ownerId)
│       └── favorites.schema.ts           # NEW — toggleFavoriteSchema
└── components/
    └── equipment/
        ├── favorite-button.tsx           # NEW — Client Component, Toggle + Heart icon
        └── equipment-filter-bar.tsx      # NEW — Client Component, Select(category) + Input(location), pushes to URL searchParams
```

### Pattern 1: Server-side filtering via `searchParams` (not client-side array filtering)

**What:** The `/browse` page reads `category`/`location` from `searchParams` (a Promise in Next.js 15 — must `await` it in the page component), passes them into `listingService.getAllEquipment({ category, location })`, which builds a Supabase query-builder chain server-side. The filter *inputs* live in the URL (so filtered views are shareable/bookmarkable, and the back button works correctly); the filter *execution* always happens in the database query, never in browser JS.
**When to use:** Any list/browse page where the dataset could grow past what's reasonable to ship to the client unfiltered.
**Example:**
```typescript
// src/app/(farmer)/browse/page.tsx
// Source: Next.js 15 docs — searchParams is async (Promise) since Next 15
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; location?: string }>
}) {
  const { category, location } = await searchParams
  const result = await listingService.getAllEquipment({ category, location })
  // ... render result.data, render EquipmentFilterBar as a small client component
  // that updates the URL via useRouter().push / Link with new query params
}
```
```typescript
// src/lib/services/listing.service.ts (extended)
export async function getAllEquipment(filters?: { category?: string; location?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('equipments')
    .select('*, equipment_images(*), users!owner_id(full_name)')
    .is('deleted_at', null) // soft-delete filter — never show deleted listings
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.location) query = query.ilike('location', `%${filters.location}%`)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return { success: false, message: 'Could not load equipment', data: null }
  return { success: true, message: 'OK', data }
}
```

### Pattern 2: Soft delete via `deleted_at` column, never a hard `DELETE`

**What:** Equipment delete sets `deleted_at = now()` (and optionally `is_active = false` for a clearer boolean check in policies) instead of removing the row. Every read path filters `WHERE deleted_at IS NULL`. This preserves referential integrity for any booking that references the equipment — the booking's `equipment_id` foreign key never dangles, and a farmer's booking history still resolves to a real (if hidden) equipment row showing the title/details of what they once booked.
**When to use:** Any entity that is the target of a foreign key from a row the application must continue to display/audit after the parent is "deleted" by its owner — exactly the equipment/booking relationship here.
**Example:**
```sql
-- supabase/migrations/0002_phase2_schema.sql
ALTER TABLE public.equipments ADD COLUMN deleted_at timestamptz;

-- equipments select policy must also exclude soft-deleted rows for the public browse path
-- (the owner can still see their own deleted listings on their dashboard if desired —
-- decide this via CONTEXT.md; default recommendation: hide everywhere including owner dashboard,
-- simpler mental model of "deleted means gone")
```
```typescript
// src/lib/services/listing.service.ts
export async function softDeleteEquipment(equipmentId: string, ownerId: string) {
  const supabase = await createClient()
  // Re-verify ownership server-side BEFORE the write — never trust UI-level hiding of the delete button
  const { data: equipment } = await supabase
    .from('equipments')
    .select('owner_id')
    .eq('id', equipmentId)
    .single()
  if (!equipment || equipment.owner_id !== ownerId) {
    return { success: false, message: 'You do not have permission to delete this listing', data: null }
  }
  const { error } = await supabase
    .from('equipments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', equipmentId)
  if (error) return { success: false, message: 'Could not delete listing', data: null }
  return { success: true, message: 'Listing deleted', data: null }
}
```

### Pattern 3: Service-layer status-transition guard extended for `completed`/`cancelled` (consistent with Phase 1's pending->approved/rejected guard)

**What:** `booking.service.ts` already implements (per Phase 1 Plan 01-05) a guard where `approveBooking`/`rejectBooking` verify the booking's *current* status is `pending` before transitioning, and verify the actor owns the equipment. Phase 2 extends the same pattern: `completeBooking(bookingId, ownerId)` only succeeds if current status is `approved`; `cancelBooking(bookingId, actorId, actorRole)` only succeeds if current status is `pending` or `approved`, and the actor is either the farmer who made the booking OR the owner of the equipment (both parties can cancel — see Open Questions for the exact rule, which is a CONTEXT.md decision point, not purely a research finding).
**When to use:** Every status-changing operation in this domain — never accept a caller-supplied target status string; the target status is always hardcoded inside the specific named function (`completeBooking` always sets `'completed'`, never a parameter).
**Example:**
```typescript
// src/lib/services/booking.service.ts (extended)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'rejected', 'cancelled'],   // farmer can cancel their own pending request
  approved: ['completed', 'cancelled'],              // owner marks completed; either party can cancel before completion
  rejected: [],                                       // terminal
  completed: [],                                      // terminal
  cancelled: [],                                       // terminal
}

export async function completeBooking(bookingId: string, ownerId: string) {
  const supabase = await createClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, equipments!equipment_id(owner_id)')
    .eq('id', bookingId)
    .single()
  if (!booking || booking.equipments.owner_id !== ownerId) {
    return { success: false, message: 'You do not have permission to update this booking', data: null }
  }
  if (!VALID_TRANSITIONS[booking.status]?.includes('completed')) {
    return { success: false, message: `Cannot mark a ${booking.status} booking as completed`, data: null }
  }
  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .select()
    .single()
  if (error) return { success: false, message: 'Could not update booking status', data: null }
  await notificationService.createNotification({
    userId: booking.farmer_id,
    bookingId,
    message: 'Your booking has been marked as completed',
  })
  return { success: true, message: 'Booking marked completed', data: updated }
}
```

### Pattern 4: Database-level transition guard trigger (secondary enforcement layer)

**What:** A `BEFORE UPDATE` trigger on `bookings` that re-validates `OLD.status -> NEW.status` against the same allowed-transitions table, raising an exception on an invalid jump. This is a second independent enforcement layer behind the service-layer check — mirroring how the `EXCLUDE` constraint already backs up booking creation's pre-check.
**When to use:** Recommended as defense-in-depth given this project's explicit "no arbitrary status jumps" success criterion language ("verified server-side, not just hidden in the UI") — a trigger holds even if a future code path forgets the service-layer check.
**Example:**
```sql
-- Source: PostgreSQL trigger docs (OLD/NEW row comparison in BEFORE UPDATE) — pattern confirmed
-- via official Postgres docs and corroborated by Cybertec/Vlad Mihalcea trigger-constraint writeups.
CREATE OR REPLACE FUNCTION public.enforce_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW; -- no-op update to other columns, not a transition
  END IF;
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
```
Note: this is `LANGUAGE plpgsql` (not `SQL`) consistent with Phase 1's helper-function convention, though here it is a row-trigger function rather than a SECURITY DEFINER RLS helper — different mechanism, same "always plpgsql for anything beyond a trivial expression" project habit.

### Anti-Patterns to Avoid

- **Hard-deleting equipment with `ON DELETE CASCADE` on `bookings.equipment_id`:** Destroys booking history/audit trail the instant an owner deletes a listing; use soft delete instead (Pattern 2).
- **Accepting a `status` parameter in `cancelBookingAction`/`completeBookingAction`:** Exactly the Phase 1 Anti-Pattern 1 (trusting client-submitted status) — the target status must be hardcoded per function name, never passed through.
- **Filtering the browse page client-side after fetching all rows:** Defeats the purpose of `category`/`location` filters at any real scale and contradicts CLAUDE.md's "paginate lists" performance convention.
- **Using a direct cross-table subquery in the new `favorites` RLS policy "just to double check the equipment exists":** Not actually needed here (favorites only references the current user's own `farmer_id`), but if a future policy needs an equipment-existence check, route it through `owns_equipment()` or a new equivalent helper — never a raw subquery into another RLS-protected table (Pitfall 1 from Phase 1's PITFALLS.md applies to every future table, not just the original five).
- **Skipping the BEFORE UPDATE trigger because "the service layer already checks it":** The whole point of defense-in-depth (matching the EXCLUDE constraint pattern) is that the DB-level guard holds even when application code has a bug — don't treat the trigger as redundant/optional.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-range duration calc for any future booking-period display | Manual day-counting loop | `date-fns`'s `differenceInCalendarDays` (already used in Phase 1's `booking.service.ts`) | Already a project dependency, already the established pattern — don't introduce a second date-math approach |
| Status transition validation | Inline `if/else` chains repeated in every action | A single `VALID_TRANSITIONS` lookup table/object referenced by every transition function (Pattern 3) | Centralizes the state machine definition in one place — adding a future status or transition rule means editing one object, not hunting through multiple functions |
| Favorite toggle "is this favorited" check on every equipment card in a list | N+1 query (one favorites lookup per card) | A single `getFavoritedEquipmentIds(farmerId)` call returning a `Set<string>` of equipment IDs, joined client-side against the already-fetched equipment list in one render pass | Avoids N database round-trips on the browse page; consistent with the "avoid unnecessary re-renders / N+1" performance discipline already implicit in CLAUDE.md |
| Search/filter query building | Hand-concatenated SQL strings | Supabase JS query builder chaining (`.eq()`, `.ilike()`) | CLAUDE.md explicitly forbids raw SQL inside components and this extends naturally to forbidding raw SQL string-building inside the service layer too — the query builder is parameterized and avoids injection by construction |

**Key insight:** Every "don't hand-roll" item above is really the same principle repeated: centralize state/logic in exactly one place (one transitions table, one service function, one query-builder call) rather than letting equivalent logic drift across multiple Server Actions or components — this is what keeps the 500-line-file constraint achievable as the codebase grows.

## Runtime State Inventory

> Not applicable — Phase 2 is additive (new table, new columns, new functions), not a rename/refactor/migration phase. No existing strings, IDs, or external service configurations are being renamed.

**Nothing found in this category** — verified by reading the phase description and ROADMAP.md Phase 2 goal; this phase adds capability, it does not rename or migrate existing identifiers.

## Common Pitfalls

### Pitfall 1: Forgetting RLS on the new `favorites` table (the exact "looks done but isn't" item Phase 1's own PITFALLS.md calls out by name)

**What goes wrong:** Phase 1's PITFALLS.md explicitly warns: "RLS enabled on table but no policies added... forgotten on tables added later (favorites, notifications...)." A new `favorites` table created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately after `CREATE TABLE` is open to any authenticated (or even anon, depending on key exposure) read/write via the Supabase client.
**Why it happens:** It's easy to focus on "does the feature work" (toggle button works, list shows up) and forget the table-level security step that has no visible UI symptom when missing.
**How to avoid:** In the new migration file, enable RLS in the same statement block as `CREATE TABLE public.favorites`, exactly as Phase 1's `0001_init_schema.sql` did for every table. Add policies: `SELECT`/`INSERT`/`DELETE` all gated by `farmer_id = (select auth.uid())` — no helper function needed since this is pure self-ownership, no cross-table role check.
**Warning signs:** A migration diff that adds `CREATE TABLE public.favorites (...)` without an adjacent `ENABLE ROW LEVEL SECURITY` line in the same file.

### Pitfall 2: Soft-delete filter forgotten on one of the three equipment read paths

**What goes wrong:** `getAllEquipment()` gets the `deleted_at IS NULL` filter (because it's the obviously-public path), but `getEquipmentById()` or `getEquipmentByOwner()` don't — meaning a "deleted" listing is still directly viewable by URL (`/equipment/[id]`) even though it no longer appears in the browse grid, or a deleted listing still shows on the owner's own dashboard looking identical to an active one.
**Why it happens:** Each read function is a separate query; there's no single chokepoint enforcing the filter unless deliberately added to each one.
**How to avoid:** Add `.is('deleted_at', null)` to all three functions (`getAllEquipment`, `getEquipmentById`, `getEquipmentByOwner`) — or, simpler, add a Postgres `VIEW public.active_equipments` that pre-filters and have all three functions query the view instead of the base table (decide based on whether the owner's own dashboard should show their soft-deleted listings — likely yes, for an "undo" affordance, in which case `getEquipmentByOwner` should NOT filter and the other two should).
**Warning signs:** A direct URL visit to a just-deleted equipment's detail page still renders normally instead of 404ing.

### Pitfall 3: Booking cancel/complete buttons hidden in UI only, not re-verified server-side

**What goes wrong:** The "Mark Completed" button is conditionally rendered only when `booking.status === 'approved'`, and the "Cancel" button only when status is `pending`/`approved` — but if the corresponding Server Action doesn't independently re-check the current DB status (re-fetching, not trusting a status value passed from the client), a stale page (open in two tabs, or a replayed request) could trigger an invalid transition.
**Why it happens:** It "looks done" because the happy-path UI flow naturally prevents invalid clicks — exactly the kind of gap Phase 1's PITFALLS.md "Looks Done But Isn't" checklist calls out for role boundaries, and the same logic applies here to status boundaries.
**How to avoid:** Every transition function re-fetches the booking's current status from the database at the start of the function body (never accepts a status value as an action parameter) and checks it against `VALID_TRANSITIONS` before writing — exactly Pattern 3 above.
**Warning signs:** A Server Action function signature that accepts `(bookingId, targetStatus)` instead of `(bookingId)` with the target hardcoded by function name.

### Pitfall 4: Ambiguous "who can cancel a booking" rule left undecided, causing an under- or over-permissive RLS `UPDATE` policy

**What goes wrong:** Phase 1's `bookings` `UPDATE` policy is scoped to `public.owns_equipment(equipment_id)` — i.e., only the *owner* can update a booking row at all. If Phase 2 wants the *farmer* to be able to cancel their own pending/approved booking, the existing RLS policy will silently block it (farmer's `UPDATE` simply returns zero rows affected, not a clear "permission denied" the developer might expect) unless a new `UPDATE` policy for farmer-initiated cancellation is added.
**Why it happens:** The Phase 1 schema (read in this research session) only has one `bookings` `UPDATE` policy, written when the only update operations were `approveBooking`/`rejectBooking` (owner-only). Phase 2 introduces the first farmer-initiated status mutation against a row whose RLS policy was scoped to owner-only updates.
**How to avoid:** Decide explicitly (likely a CONTEXT.md decision, see Open Questions) whether farmers can self-cancel, then add a second `UPDATE` policy: `CREATE POLICY "bookings update own as farmer for cancellation" ON public.bookings FOR UPDATE USING (farmer_id = (select auth.uid()));` — note Postgres RLS policies for the same command are OR'd together, so adding this policy does not weaken the existing owner policy, it adds an additional allowed actor.
**Warning signs:** A farmer's cancel button calls the Server Action successfully (no thrown error) but the booking's status doesn't actually change — classic silent RLS-policy-mismatch symptom, easy to misdiagnose as an application bug.

## Code Examples

### Favorites toggle service function

```typescript
// src/lib/services/favorites.service.ts
// Source: pattern consistent with Phase 1's booking.service.ts {success, message, data} convention
import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(equipmentId: string, farmerId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('farmer_id', farmerId)
    .eq('equipment_id', equipmentId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id)
    if (error) return { success: false, message: 'Could not remove favorite', data: null }
    return { success: true, message: 'Removed from favorites', data: { favorited: false } }
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ farmer_id: farmerId, equipment_id: equipmentId })
  if (error) return { success: false, message: 'Could not save favorite', data: null }
  return { success: true, message: 'Saved to favorites', data: { favorited: true } }
}

export async function getFavoritesForFarmer(farmerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, equipments(*, equipment_images(*))')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })
  if (error) return { success: false, message: 'Could not load favorites', data: null }
  return { success: true, message: 'OK', data }
}
```

### Favorites migration (new table, RLS, unique constraint)

```sql
-- supabase/migrations/0002_phase2_schema.sql (excerpt)
-- Source: pattern matches 0001_init_schema.sql's per-table RLS-immediately-after-CREATE convention
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farmer_id, equipment_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites select own" ON public.favorites
  FOR SELECT
  USING (farmer_id = (select auth.uid()));

CREATE POLICY "favorites insert own" ON public.favorites
  FOR INSERT
  WITH CHECK (farmer_id = (select auth.uid()));

CREATE POLICY "favorites delete own" ON public.favorites
  FOR DELETE
  USING (farmer_id = (select auth.uid()));
```

Note: `ON DELETE CASCADE` on `favorites.equipment_id` is intentional here (unlike the equipment-delete-itself decision) — if a farmer's favorited equipment is later hard-deleted by some future cleanup process, the dangling favorite row should disappear automatically. This does not conflict with the soft-delete recommendation for the owner-facing delete flow; it only matters for a hypothetical future hard-purge job, which is out of scope for Phase 2 itself.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `searchParams` as a plain sync object prop | `searchParams` as a `Promise`, must be `await`-ed | Next.js 15 (this project's pinned version) | Every Server Component reading `searchParams` for the new filter UI must be `async` and `await searchParams` before destructuring — a sync destructure will throw or silently misbehave depending on the exact Next.js minor version; already correctly anticipated since this project is pinned to Next 15 from the start |

**Deprecated/outdated:** None specific to this phase's domain — Phase 1's research already covers the project-wide stack currency (Next 15 vs 16, Zod v4, etc.) and nothing in Phase 2's scope touches a different part of that surface.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Farmers (not just owners) should be able to cancel their own `pending`/`approved` booking — the phase description says "a booking can be explicitly marked completed or cancelled" without naming who performs cancellation | Architecture Patterns (Pattern 3), Common Pitfalls (Pitfall 4) | If wrong (e.g., only owners can cancel, or cancellation requires a reason/dispute flow), the recommended `VALID_TRANSITIONS` table and the new farmer-scoped `UPDATE` RLS policy would need to be removed/narrowed — low rework cost since it's an additive policy, not a destructive one |
| A2 | "Completed" can only be set by the owner, manually, with no time-based auto-completion (e.g., "auto-complete N days after end_date") | Architecture Patterns (Pattern 3) | If the user actually wants automatic completion after the rental period ends, this requires either a scheduled job (Supabase Edge Function cron, or Vercel Cron — both viable on Hobby for a lightweight daily check) rather than a purely user-triggered action; this is a meaningfully different implementation, not just a tweak |
| A3 | Soft-deleted equipment should be hidden from the owner's own dashboard too (not just the public browse page) | Architecture Patterns (Pattern 2), Common Pitfalls (Pitfall 2) | If the owner actually wants to see (and potentially "undelete") their soft-deleted listings, `getEquipmentByOwner` should NOT apply the `deleted_at` filter, and a small "restore" affordance would be a natural Phase 2 or Phase 3 addition — currently unscoped either way |
| A4 | Category filter is single-select (one category at a time via `Select`), not multi-select | Standard Stack (Alternatives Considered) | If multi-select is actually wanted, the query becomes `.in('category', categoryArray)` instead of `.eq()`, and the UI component changes from `Select` to a `Checkbox` group or multi-select `Combobox` — moderate UI rework, trivial query-layer rework |
| A5 | Location filtering is a simple case-insensitive substring match (`ILIKE '%term%'`) against the existing free-text `location` column, not a structured region/city dropdown or geo-radius search | Architecture Patterns (Pattern 1) | EQUIP-05 explicitly says "text/region match," which supports this assumption, but if the user wants a controlled list of regions (dropdown) rather than free-text search, the underlying `equipments.location` column itself might need to change from `text` to an enum or a foreign key to a regions table — a schema change, not just a query change |

**If this table is empty:** N/A — see entries above; all five require confirmation before being locked into a plan, particularly A1/A2 which materially change the shape of `booking.service.ts`'s new functions.

## Open Questions

1. **Who can cancel a booking, and from which statuses?**
   - What we know: BOOK-05 says bookings reach a "true terminal state (completed or cancelled)." Phase 1's existing `bookings` `UPDATE` RLS policy only allows the owning owner to update a booking row at all — no farmer-facing `UPDATE` path exists yet.
   - What's unclear: Whether farmers can self-cancel a `pending` request (very likely — "I changed my mind before approval" is the obvious case), whether farmers can cancel an already-`approved` booking (less obvious — may need an owner-notification-only flow, or may be entirely owner-driven), and whether an owner can unilaterally cancel an approved booking (e.g., equipment broke down).
   - Recommendation: Surface this explicitly in `/gsd-discuss-phase` before planning — it directly determines the RLS policy set and the `VALID_TRANSITIONS` table shape (Assumption A1 above is this research's best-guess default: both farmer self-cancel from pending/approved, and owner-driven complete from approved).

2. **Is "completed" ever automatic (time-based), or always a manual owner action?**
   - What we know: The phase success criteria say "a booking can be explicitly marked completed" — "explicitly" suggests a manual trigger (a button), not an automatic cron-based transition.
   - What's unclear: Whether "explicitly marked" was a deliberate word choice ruling out automation, or just describing the v1 minimum without ruling out a later auto-complete enhancement.
   - Recommendation: Treat as manual-only for Phase 2 (Assumption A2), consistent with the literal wording and avoiding a Vercel Hobby cron/Edge-Function dependency this phase doesn't otherwise need; revisit as a v2/Phase 3 enhancement if desired.

3. **Should a soft-deleted equipment listing be restorable, or is delete truly final from the owner's perspective?**
   - What we know: Soft delete (this research's recommendation) makes restoration technically trivial (`UPDATE equipments SET deleted_at = NULL`), but nothing in the phase description asks for an "undo"/"restore" UI.
   - What's unclear: Whether the owner dashboard should show a "Deleted Listings" section with a restore button, or whether the soft-delete column exists purely as an internal safety mechanism with no exposed restore UI in Phase 2.
   - Recommendation: Build the column and the filtered reads now (cheap, and the right call for data integrity regardless), but treat the restore UI as out of scope for Phase 2 unless CONTEXT.md says otherwise — EQUIP-03 only requires "can delete," not "can restore."

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Live Supabase project (schema pushed) | Every Phase 2 task — all new tables/columns/policies/triggers must be migrated to the same live project Phase 1 targets | ✗ (per `01-01-SUMMARY.md`, Plan 01-01 Task 3 is blocked on `supabase login`) | — | None — this is a hard blocker inherited from Phase 1, not new to Phase 2. Phase 2 cannot begin migration work until Phase 1's Task 3 checkpoint clears (human action: `supabase login` or a `SUPABASE_ACCESS_TOKEN`) |
| Supabase CLI | Generating `supabase/migrations/0002_phase2_schema.sql` and pushing it, regenerating `types/database.ts` | ✓ (used via `npx`, confirmed working in Phase 1 up to the auth gate) | — | None needed — CLI itself works, only the login step is blocked |
| Node.js / npm | Build, typecheck (`npx tsc --noEmit`) | ✓ (Phase 1 scaffold builds clean) | — | — |
| Shadcn CLI | Adding `toggle` and `alert-dialog` components | ✓ (used successfully in Phase 1, including the one manual-fallback case for `form.tsx`) | — | If `npx shadcn@latest add toggle` silently fails again (as `form.tsx` did in Phase 1 due to the `radix-ui` unified-package dependency), the same fallback applies: fetch the registry JSON directly and write the component file manually — `radix-ui` is already installed, so this specific failure mode is less likely to recur, but worth flagging given the precedent |

**Missing dependencies with no fallback:**
- Live Supabase schema push (blocked on `supabase login`) — this blocks Phase 2 exactly as it currently blocks the rest of Phase 1. The planner should make Phase 2's first plan explicitly depend on Phase 1's Task 3 checkpoint clearing, not assume it's already resolved by the time Phase 2 starts.

**Missing dependencies with fallback:**
- Shadcn component CLI failures — manual registry-JSON fallback already proven to work in Phase 1.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — Phase 1 has no test runner configured (`package.json` has no `test` script, no `jest`/`vitest`/`playwright` dependency) |
| Config file | none — see Wave 0 |
| Quick run command | `npx tsc --noEmit -p tsconfig.json` (the only automated verification used throughout Phase 1's plans) |
| Full suite command | none configured |

This project's Phase 1 plans rely exclusively on `tsc --noEmit` plus manual verification steps (described in each plan's `<verification>` block) rather than an automated test suite. Phase 2 should follow the same convention for consistency unless a test framework is explicitly introduced — introducing one mid-project is a scope decision for discuss-phase, not something this research should silently assume.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EQUIP-02 | Owner can edit own equipment; cannot edit another owner's | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 — no automated test exists; verify manually via two owner accounts, confirm a direct Server Action call with a foreign `equipmentId` is rejected |
| EQUIP-03 | Owner can delete own equipment (soft delete); booking history remains intact | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 — verify manually: delete equipment with an existing booking, confirm farmer's dashboard still renders that booking without a crash |
| EQUIP-05 | Farmer can filter browse page by category and location | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 — verify manually: apply category filter, confirm only matching rows render; apply location text filter, confirm partial/case-insensitive match works |
| EQUIP-07 | Farmer can save/favorite equipment and find it again | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 — verify manually: favorite an item, navigate away, return to a `/farmer/favorites` page, confirm it's listed |
| BOOK-05 (completed/cancelled) | Booking transitions to completed/cancelled only from valid source states, server-enforced | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 — verify manually: attempt a direct Server Action call to mark a `pending` booking `completed` (skipping `approved`), confirm rejection; attempt a double-cancel, confirm the second attempt is rejected as a no-op-or-error, not a silent success |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit -p tsconfig.json`
- **Per wave merge:** `npx tsc --noEmit -p tsconfig.json` (no broader automated suite exists to run)
- **Phase gate:** Full manual verification pass per the table above before `/gsd-verify-work`, consistent with how Phase 1's plans were verified

### Wave 0 Gaps
- No test framework is installed at all (`jest`/`vitest`/`@testing-library/react` etc.) — if the project wants automated regression coverage of the new status-transition guard (the highest-risk new logic in this phase), introducing `vitest` would be the lightest-weight option compatible with Next.js 15 + TypeScript, but this is a net-new tooling decision outside this phase's stated scope unless explicitly requested.
- If introduced: `npx vitest` config + a `src/lib/services/booking.service.test.ts` covering the `VALID_TRANSITIONS` table exhaustively (every status pair, asserting allowed vs. rejected) would be the single highest-value test given how central the transition guard is to this phase's BOOK-05 requirement.

*(Recommendation: treat automated testing as out-of-scope for Phase 2 unless CONTEXT.md says otherwise — Phase 1 set the precedent of typecheck + manual verification only, and introducing a test framework mid-project is a scope/tooling decision, not a research-driven default.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no (unchanged from Phase 1) | Supabase Auth, unchanged in this phase |
| V3 Session Management | no (unchanged from Phase 1) | `@supabase/ssr` cookie-based session, unchanged |
| V4 Access Control | yes | RLS policies (favorites self-ownership; equipment update/delete via `owns_equipment()`; booking update via owner-scoped + new farmer-scoped policy) as the authoritative layer; service-layer ownership re-verification as the first gate |
| V5 Input Validation | yes | Zod schemas for `updateEquipmentSchema` (partial, still excludes `ownerId`), `toggleFavoriteSchema` (just an equipment UUID), and the booking transition functions (no client-supplied status accepted at all) |
| V6 Cryptography | no | Not touched by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Owner A edits/deletes Owner B's equipment via a forged `equipmentId` in a direct Server Action call | Elevation of Privilege | Service layer re-fetches `equipment.owner_id` and compares to the session's `ownerId` BEFORE any write, independent of UI button visibility; RLS `UPDATE`/`DELETE` policy via `owns_equipment()` is the second independent gate (mirrors Phase 1's `T-03-01`/equivalent pattern) |
| Farmer cancels another farmer's booking via a forged `bookingId` | Elevation of Privilege | `cancelBooking` re-fetches the booking and compares `farmer_id` to the session's actor id before allowing the transition; RLS `UPDATE` policy scoped to `farmer_id = auth.uid()` is the second gate |
| Arbitrary status jump (e.g. `pending` -> `completed` directly, skipping `approved`) via a crafted request | Tampering | `VALID_TRANSITIONS` lookup table checked server-side in every transition function; `BEFORE UPDATE` trigger as a second, DB-level enforcement layer (Pattern 4) — this is the literal "no arbitrary status jumps" success criterion from the phase description |
| Forgetting RLS on the new `favorites` table | Information Disclosure / Tampering | `ENABLE ROW LEVEL SECURITY` in the same migration statement block as `CREATE TABLE public.favorites`, exactly as every Phase 1 table did — see Common Pitfalls Pitfall 1 |
| Soft-deleted equipment still directly reachable by URL/ID after "deletion" | Information Disclosure | All three equipment-read service functions apply the `deleted_at IS NULL` filter (or query a pre-filtered view) — see Common Pitfalls Pitfall 2; `getEquipmentById` specifically must 404 (via Next's `notFound()`, already the Phase 1 pattern for nonexistent IDs) for a soft-deleted row when accessed by a non-owner |

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT.md decisions. Every Phase 2 plan must comply:

- **No `.js` files; TypeScript only** — all new files (`favorites.service.ts`, `favorites.schema.ts`, `favorites.actions.ts`, edit/delete pages) must be `.ts`/`.tsx`.
- **Server Components first; Client Components only when interactivity requires it** — the favorite-toggle button and the filter-bar inputs are the only genuinely interactive new pieces in this phase and are the only places a `'use client'` directive is justified; the browse page itself, the equipment edit page's initial render, and the favorites list page remain Server Components.
- **Max 500 lines/file, ~80 lines/component** — `booking.service.ts` and `listing.service.ts` are already non-trivial after Phase 1; adding `completeBooking`/`cancelBooking` and `updateEquipment`/`softDeleteEquipment` respectively should be checked against this limit before the file grows further — split into a second file (e.g. `booking-transitions.service.ts`) only if the 500-line ceiling is actually approached, not preemptively.
- **Zod for all validation** — `updateEquipmentSchema` and `toggleFavoriteSchema` must exist and be used in every corresponding Server Action; no Server Action accepts unvalidated `FormData` fields directly.
- **No raw SQL inside components; service layer only** — the `searchParams`-driven filtering (Pattern 1) must call `listingService.getAllEquipment(filters)`, never build a Supabase query directly inside `/browse/page.tsx`.
- **API responses always `{success, message, data}`** — every new service function (`updateEquipment`, `softDeleteEquipment`, `completeBooking`, `cancelBooking`, `toggleFavorite`, `getFavoritesForFarmer`) and every new Server Action must return this exact shape, matching every Phase 1 service function.
- **Booking integrity — `total_amount` never recomputed/trusted from client on a status transition** — `completeBooking`/`cancelBooking` must not accept or modify `total_amount`; the value set at booking creation is immutable through every later transition.
- **Date-range conflict enforcement stays at the EXCLUDE constraint** — Phase 2 does not touch booking creation's conflict logic; the new transition guard (Pattern 3/4) is additive, not a replacement for the existing `bookings_no_overlap` constraint. Note the existing constraint's `WHERE (status IN ('pending', 'approved'))` clause already correctly excludes `completed`/`cancelled`/`rejected` bookings from blocking new date ranges — no migration change needed to the EXCLUDE constraint itself.
- **RLS policies must not read `user_metadata`** — the new `favorites` policies and the new farmer-scoped `bookings` `UPDATE` policy (Common Pitfalls Pitfall 4) must reference `public.users`/`auth.uid()` only, never `user_metadata`.
- **Secrets** — no new secrets are introduced by this phase; `NVIDIA_API_KEY` is untouched and out of scope here.

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/0001_init_schema.sql` (this repository) — exact live schema, RLS helper pattern, EXCLUDE constraint scope — read directly, not web-sourced
- `.planning/phases/01-walking-skeleton/01-05-PLAN.md`, `01-03-PLAN.md`, `01-02-PLAN.md` (this repository) — established service-layer/Server-Action/Zod conventions Phase 2 must stay consistent with
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` (this repository, Phase 1 research) — already-validated EXCLUDE constraint pattern, RLS recursion avoidance, soft-delete-adjacent "looks done but isn't" checklist items
- [PostgreSQL: Documentation: CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html) — official docs confirming `BEFORE UPDATE` trigger access to OLD/NEW row data for state-machine validation — HIGH confidence (official docs)
- `npm view lucide-react version`, `npm view date-fns version` — direct registry queries confirming no version drift since Phase 1 scaffold — HIGH confidence (live registry data)

### Secondary (MEDIUM confidence)
- [Next.js docs — App Router search/pagination guide](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — official docs confirming `searchParams` server-side filtering pattern — MEDIUM confidence (official docs via web search snippet)
- [PostgreSQL trigger consistency check — Vlad Mihalcea](https://vladmihalcea.com/postgresql-trigger-consistency-check/) and [Cybertec — Triggers to enforce constraints](https://www.cybertec-postgresql.com/en/triggers-to-enforce-constraints/) — corroborating sources for the OLD/NEW status-transition trigger pattern — MEDIUM confidence (third-party but technically-authoritative Postgres consultancy sources)
- [Supabase — How to implement soft delete (discussion #2799)](https://github.com/orgs/supabase/discussions/2799) and [The Distance — soft deletes in Supabase](https://thedistance.co.uk/insights/how-to-handle-soft-deletes-in-supabase-using-sql) — corroborating the `deleted_at` column + filtered-read pattern over hard delete with cascade — MEDIUM confidence (community + vendor-adjacent sources)
- [Shadcn UI — Toggle](https://ui.shadcn.com/docs/components/radix/toggle) — official component docs for the favorite-button affordance — MEDIUM confidence (official docs via web search snippet)

### Tertiary (LOW confidence)
- General web search results on "shadcn filter sidebar/combobox" patterns — used only to confirm that no new heavyweight dependency (e.g., a dedicated filter-panel library) is needed; the actual recommendation (plain `Select` + `Input`) is this research's own synthesis, not a direct quote from any single tertiary source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all versions directly verified against the live npm registry and the project's own `package.json`
- Architecture: HIGH — extends a Phase 1 architecture already validated by official Supabase/Postgres/Next.js docs in the prior research pass; this phase's new patterns (soft delete, transition trigger, searchParams filtering) are each independently corroborated by official or near-official sources
- Pitfalls: HIGH — every pitfall identified here is either a direct extension of a named pitfall already documented in Phase 1's PITFALLS.md (RLS-forgotten-on-new-table) or a structurally identical pattern (status-transition guard mirrors the existing approve/reject guard, ownership re-verification mirrors the existing equipment-update pattern)

**Research date:** 2026-06-26
**Valid until:** 2026-07-26 (30 days — stable domain, no fast-moving dependencies; re-verify package versions if Phase 2 execution is delayed past this window, particularly Next.js's 15-line patch version and Zod v4 minor releases)
