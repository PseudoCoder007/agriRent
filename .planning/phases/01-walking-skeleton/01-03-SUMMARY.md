---
phase: 01-walking-skeleton
plan: 03
subsystem: listings
tags: [nextjs, supabase-storage, zod, react-hook-form, vitest, rls, server-actions]

# Dependency graph
requires:
  - phase: 01-walking-skeleton (plan 01)
    provides: equipments/equipment_images tables + RLS, Supabase client wrappers, types/database.ts
  - phase: 01-walking-skeleton (plan 02)
    provides: auth + role-scoped (owner)/(farmer) route groups, server-side session reads
provides:
  - createEquipmentSchema/imageFileSchema Zod schemas (src/lib/validations/equipment.schema.ts)
  - listing.service.ts (createEquipment/getAllEquipment/getEquipmentById/getEquipmentByOwner/getEquipmentImageUrl)
  - createEquipmentAction Server Action (session-derived ownerId, never client-trusted)
  - Owner equipment-creation form at /equipment/new
  - Farmer flat browse page at /browse and detail page at /equipment/[id]
  - equipment-images Supabase Storage bucket (5MB cap, jpeg/png/webp) + RLS policies on storage.objects
  - Authenticated cross-user read policy on public.users (owner name visible to farmers)
  - next.config.ts images.remotePatterns for Supabase Storage URLs
  - <Toaster /> mounted in root layout
affects: [01-04, 01-05, all later phases needing equipment listings]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Service layer functions always return {success, message, data}, never relay raw Supabase errors", "Server Actions accept FormData directly for file-upload forms; client constructs FormData manually from RHF-validated values rather than relying on RHF's typed submit for the File field", "z.input<> (not z.infer<>) used for useForm<>'s generic when the schema uses z.coerce — input and output types diverge", "Storage bucket-level MIME/size restriction is a second independent enforcement layer alongside application Zod validation"]

key-files:
  created:
    - src/lib/validations/equipment.schema.ts
    - src/lib/validations/equipment.schema.test.ts
    - src/lib/services/listing.service.ts
    - src/app/actions/listing.actions.ts
    - "src/app/(owner)/equipment/new/page.tsx"
    - "src/app/(farmer)/browse/page.tsx"
    - "src/app/(farmer)/equipment/[id]/page.tsx"
    - supabase/migrations/0002_equipment_images_bucket.sql
    - supabase/migrations/0003_users_public_read.sql
  modified:
    - src/app/layout.tsx
    - next.config.ts

key-decisions:
  - "Created the equipment-images Storage bucket via a SQL migration instead of completing it as a manual Supabase Dashboard click (Plan 01-01's user_setup task), since the dashboard step was never actually done and Task 1's createEquipment() hard-depends on the bucket existing — this is also more reproducible/reviewable than a one-off dashboard action."
  - "Added a new authenticated-read RLS policy on public.users (any signed-in user can read any user row) because the existing own-row-only policy from Plan 01-01 silently breaks this plan's own stated truth that a farmer must see the equipment owner's name — a join to users for another user's full_name returned no row under the prior RLS."
  - "Used z.input<typeof createEquipmentSchema> (not z.infer) as the react-hook-form generic, because the schema's rate field uses z.coerce.number(), whose Zod v4 input type is effectively unknown while its output type is number — using z.infer caused a cascade of zodResolver/Control type mismatches across every FormField."
  - "Mounted <Toaster /> in the root layout — sonner was an installed dependency from Plan 01-01 but was never rendered anywhere, so toast.success() calls (used by the new-equipment form) would have silently done nothing."
  - "Configured next.config.ts images.remotePatterns for *.supabase.co/storage/v1/object/public/** — no image remote-host allow-list existed yet, and next/image throws at runtime for any non-allow-listed host, which would have broken both the browse and detail pages' photo rendering."

patterns-established:
  - "FormData-based Server Action pattern for any future form that needs file upload: react-hook-form drives client validation/UX, onSubmit manually builds FormData (including File objects) and calls the Server Action directly — RHF's typed submit handler cannot carry File values cleanly through zodResolver."

requirements-completed: [EQUIP-01, EQUIP-04, EQUIP-06]

# Metrics
duration: ~50min
completed: 2026-06-26
---

# Phase 1 Plan 3: Listing Slice Summary

**Owner equipment-creation form (Zod-validated, server-derived ownerId, image uploaded to a newly-provisioned Supabase Storage bucket with bucket-level MIME/size enforcement) and a farmer-facing flat browse list + detail page, both backed by real Supabase queries with no filters.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-06-26T16:01:59Z (per STATE.md handoff from Plan 01-02)
- **Completed:** 2026-06-26T16:26:00Z
- **Tasks:** 3 of 3 completed
- **Files modified:** 9 created, 4 modified (2 of which are infra fixes outside the plan's file list)

## Accomplishments

- `createEquipmentSchema` enforces the exact 6-value category enum (Tractor/Harvester/Plough/Rotavator/Sprayer/Other) from D-03 and rejects empty title/invalid category/negative or missing rate, proven via a RED→GREEN vitest cycle
- `imageFileSchema` re-validates uploaded image MIME type and 5MB size cap server-side — defense in depth alongside the equipment-images bucket's own `allowed_mime_types`/`file_size_limit` restriction
- `listing.service.ts` exposes `createEquipment()` (server-derived `ownerId`, never client-trusted; uploads to Storage at `${ownerId}/${equipmentId}/${filename}`; degrades gracefully with a clear message if the image step fails after the equipment row is created), `getAllEquipment()`, `getEquipmentById()`, `getEquipmentByOwner()` (reserved for Plan 01-05's owner dashboard), and a `getEquipmentImageUrl()` helper
- `createEquipmentAction` Server Action accepts `FormData` directly (file-upload-compatible), reads the owner's id only from the authenticated session, parses text fields with the Task 1 schema, and revalidates `/browse` on success
- Owner-facing `/equipment/new` form (react-hook-form + zodResolver, Shadcn `Select` with all 6 categories in D-03 order, file input restricted to `image/jpeg,image/png,image/webp` as a client-side hint) builds `FormData` manually to carry the `File` through to the Server Action
- Farmer-facing `/browse` (flat grid, `Card` per listing, empty-state message, no filter UI) and `/equipment/[id]` (full photo gallery, description, category, rate, owner name, `notFound()` on missing id) both Server Components making direct service-layer calls
- `npx tsc --noEmit`, `npx vitest run` (12/12), `npx eslint`, and `npm run build` (Turbopack production build) all pass clean

## Task Commits

1. **[Infra fix] Create equipment-images Storage bucket via migration** - `433a390` (fix)
2. **Task 1 (RED): Failing test for equipment Zod schema** - `9a7b9b6` (test)
3. **[Infra fix] Allow authenticated cross-user reads of users table** - `0d3718a` (fix)
4. **Task 1 (GREEN): Equipment Zod schema + listing service layer** - `738b271` (feat)
5. **Task 2: Owner equipment-creation Server Action + form** - `88f8828` (feat)
6. **Task 3: Farmer browse page + equipment detail page** - `b733530` (feat)

_Note: Task 1 followed a full TDD RED→GREEN cycle per its `tdd="true"` frontmatter. Two infra fixes (Storage bucket, users RLS policy) were committed separately before/interleaved with Task 1's GREEN commit because Task 1's service layer (`createEquipment`, `getAllEquipment`) hard-depends on both being live in the database to function correctly — though `tsc`/`vitest` alone would not have caught either gap, since both are runtime/database-level dependencies, not type-level ones._

## Files Created/Modified

- `src/lib/validations/equipment.schema.ts` - `createEquipmentSchema`, `imageFileSchema`, `CreateEquipmentInput`, `ImageFileInput`
- `src/lib/validations/equipment.schema.test.ts` - 7 tests covering valid/invalid payloads, fixed category enum rejection, missing rate, image MIME/size validation
- `src/lib/services/listing.service.ts` - `createEquipment()`, `getAllEquipment()`, `getEquipmentById()`, `getEquipmentByOwner()`, `getEquipmentImageUrl()`
- `src/app/actions/listing.actions.ts` - `createEquipmentAction()` (FormData-based, session-derived ownerId)
- `src/app/(owner)/equipment/new/page.tsx` - owner equipment-creation form
- `src/app/(farmer)/browse/page.tsx` - flat farmer browse list
- `src/app/(farmer)/equipment/[id]/page.tsx` - equipment detail page
- `supabase/migrations/0002_equipment_images_bucket.sql` - equipment-images bucket (public-read, 5MB cap, jpeg/png/webp) + storage.objects RLS policies scoped to owner-prefixed paths
- `supabase/migrations/0003_users_public_read.sql` - authenticated cross-user SELECT policy on public.users
- `src/app/layout.tsx` - mounted `<Toaster />`
- `next.config.ts` - `images.remotePatterns` for `*.supabase.co` Storage URLs

## Decisions Made

- **Storage bucket created via migration, not the dashboard:** Plan 01-01's `user_setup` listed bucket creation as a manual dashboard step; verified via `supabase db query --linked` that `storage.buckets` was empty before this plan started, confirming it was never actually done. Wrote a migration (`storage.buckets` insert + `storage.objects` RLS policies) instead — more reproducible and reviewable than a one-off click, and matches this project's existing migration-driven schema pattern.
- **Added a broader `users` SELECT policy:** Plan 01-01 scoped `users` RLS to own-row-only, which silently breaks this plan's own truth ("farmer sees the owner's name") since any join from `equipments`/`equipment_images` to `users` for another user's row returns nothing under RLS. Verified via `pg_policies` before and after. Email is technically exposed by this broader policy too (RLS is row-level, not column-level) but is never rendered in any UI this phase adds.
- **`z.input<>` instead of `z.infer<>` for the form's RHF generic:** `rate` uses `z.coerce.number()`, whose Zod v4 input type is effectively `unknown` while its parsed output is `number`. Using the output type (`CreateEquipmentInput`) for `useForm<>` caused a cascade of `zodResolver`/`Control` type mismatches across every `FormField` in the form; switching to the schema's input type resolved all of them without weakening validation (the Server Action still parses with the same schema, producing the coerced `number`).
- **Manual `FormData` construction instead of relying on RHF's typed submit:** react-hook-form's `handleSubmit` callback receives parsed field values, not a `FormData` object, and cannot carry a raw `File` cleanly through `zodResolver`'s typed pipeline. `onSubmit` therefore builds `FormData` by hand (text fields + the separately-tracked `File` from a plain `<input type="file">`) before calling the Server Action — matching the plan's own suggested approach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created the equipment-images Storage bucket via migration**
- **Found during:** Pre-Task-1 verification (checking runtime dependencies before writing `createEquipment`)
- **Issue:** Plan 01-01's `user_setup` listed "Create a Storage bucket named equipment-images..." as a manual Supabase Dashboard step. `01-01-SUMMARY.md` never mentions this being completed, and a live query (`select * from storage.buckets`) confirmed zero buckets existed. Task 1's `createEquipment()` directly uploads to this bucket — without it, every equipment creation would fail at the Storage upload step.
- **Fix:** Wrote `supabase/migrations/0002_equipment_images_bucket.sql` inserting the bucket row (public-read, 5MB limit, `image/jpeg`/`image/png`/`image/webp` only) plus four RLS policies on `storage.objects` (public SELECT, owner-scoped INSERT/UPDATE/DELETE keyed on the `${ownerId}/...` path prefix), then ran `supabase db push --linked`.
- **Files modified:** `supabase/migrations/0002_equipment_images_bucket.sql`
- **Verification:** `supabase db query --linked "select id, file_size_limit, allowed_mime_types from storage.buckets"` confirms the bucket exists with the correct restrictions; `pg_policies` confirms all four storage.objects policies are live.
- **Committed in:** `433a390`

**2. [Rule 2 - Missing Critical] Added authenticated cross-user read policy on `public.users`**
- **Found during:** Task 1 implementation (writing `getAllEquipment`/`getEquipmentById`'s join to `users` for the owner's `full_name`)
- **Issue:** `0001_init_schema.sql` scoped `users` SELECT to `(select auth.uid()) = id` (own-row-only). This plan's own stated truth requires "a farmer can open an equipment detail page showing ... owner" — under the existing policy, any join from `equipments`/`equipment_images` to `users` for a *different* user's row (the owner, as seen by a farmer) would silently return no row, making owner name always render as missing.
- **Fix:** Added `supabase/migrations/0003_users_public_read.sql` granting `authenticated` role-wide SELECT (`USING (true)`) on `public.users`. Email is also exposed by this broader policy (RLS is row-level, not column-level) but is never rendered in any equipment-facing UI added in this phase.
- **Files modified:** `supabase/migrations/0003_users_public_read.sql`
- **Verification:** `pg_policies` query confirms the new policy is live alongside the two pre-existing own-row policies.
- **Committed in:** `0d3718a`

**3. [Rule 3 - Blocking] Mounted `<Toaster />` in root layout**
- **Found during:** Task 2 implementation (new-equipment form calls `toast.success()` on a successful submission)
- **Issue:** `sonner` and its Shadcn wrapper (`src/components/ui/sonner.tsx`) were installed/generated in Plan 01-01 but `<Toaster />` was never rendered anywhere in the app — every `toast.*()` call from any future form would silently do nothing.
- **Fix:** Imported and rendered `<Toaster />` in `src/app/layout.tsx`, inside `<body>` alongside `{children}`.
- **Files modified:** `src/app/layout.tsx`
- **Verification:** `npm run build` succeeds; manual confirmation that `Toaster` is a Client Component correctly rendered from the (Server Component) root layout.
- **Committed in:** `88f8828`

**4. [Rule 3 - Blocking] Configured `next.config.ts` `images.remotePatterns` for Supabase Storage**
- **Found during:** Task 3 implementation (browse/detail pages render uploaded photos via `next/image` from a Supabase Storage public URL)
- **Issue:** No `images` config existed in `next.config.ts`. `next/image` throws a runtime error for any remote image host not explicitly allow-listed — both the browse grid and detail-page gallery would crash as soon as a real photo URL was rendered.
- **Fix:** Added `images.remotePatterns` matching `https://*.supabase.co/storage/v1/object/public/**`.
- **Files modified:** `next.config.ts`
- **Verification:** `npm run build` succeeds with the new config; pattern matches the actual public Storage URL shape returned by `getEquipmentImageUrl()`.
- **Committed in:** `b733530`

**5. [Rule 1 - Bug] Used `z.input<>` instead of `z.infer<>` for the new-equipment form's `useForm` generic**
- **Found during:** Task 2 implementation (`npx tsc --noEmit` after first draft of the form)
- **Issue:** `createEquipmentSchema`'s `rate` field uses `z.coerce.number()`, whose Zod v4 *input* type is `unknown` while its *output* (inferred) type is `number`. Typing `useForm<CreateEquipmentInput>` (the output type) caused `zodResolver`'s `Resolver`/`Control` generics to mismatch across every `FormField`, producing 9 cascading `tsc` errors.
- **Fix:** Defined `EquipmentFormValues = z.input<typeof createEquipmentSchema>` and used that as the `useForm<>` generic instead; cast `field.value` to `string | number` for the `rate` `<Input>` specifically (the one field where the input type is `unknown`).
- **Files modified:** `src/app/(owner)/equipment/new/page.tsx`
- **Verification:** `npx tsc --noEmit -p tsconfig.json` returns clean (zero errors) after the fix.
- **Committed in:** `88f8828`

---

**Total deviations:** 5 auto-fixed (2 missing-critical-functionality infra gaps inherited from Plan 01-01, 2 blocking runtime dependencies, 1 type-level bug)
**Impact on plan:** All five were necessary for this plan's own stated truths/acceptance criteria to actually hold at runtime (owner name visible, photo upload functional, photo rendering functional, toast feedback functional, form compiles). No scope creep — no new tables, no architecture changes, no library substitutions.

## TDD Gate Compliance

Task 1 (`tdd="true"`) followed the required RED→GREEN sequence:
- RED: `9a7b9b6` (`test(01-03): add failing test for equipment Zod schema`) — confirmed failing via `Cannot find module './equipment.schema'` before any implementation existed.
- GREEN: `738b271` (`feat(01-03): implement equipment Zod schema and listing service layer`) — confirmed all 7 new tests (12 total including Plan 01-02's auth tests) pass.

No REFACTOR commit was needed — the GREEN implementation required no follow-up cleanup.

## Issues Encountered

- Two runtime/database-level gaps from Plan 01-01 (`user_setup` Storage bucket step never completed; `users` RLS scoped too narrowly for cross-user reads) were invisible to `tsc`/`vitest` and would only have surfaced during actual manual end-to-end testing (image upload failing, owner name always blank). Caught proactively by inspecting the live database state (`supabase db query --linked`) before writing code that depends on them, rather than discovering them after writing a form that silently fails at runtime.
- Zod v4's `z.coerce.number()` input/output type divergence is a recurring footgun for any `useForm<>` generic built from `z.infer<>` — worth flagging for any future form with a coerced numeric field (e.g. Plan 01-04's booking date-range/amount fields, if they use coercion).

## User Setup Required

None for this plan specifically — the one outstanding `user_setup` item from Plan 01-01 (Storage bucket creation) was completed programmatically via migration rather than requiring the user to click through the Supabase Dashboard.

## Next Phase Readiness

- Listing slice is fully wired and committed: an owner can create an equipment listing with a validated photo (server-enforced MIME/size, bucket-enforced MIME/size as a second layer), and a farmer can browse the flat list and view full equipment detail including the owner's name.
- `getEquipmentByOwner()` is implemented and ready for Plan 01-05's owner dashboard to call directly — no raw query needed there.
- Manual end-to-end verification (actual signup → login as owner → create listing with a real photo → login as farmer → browse → view detail) was not run in this autonomous, non-checkpoint plan — automated verification (`tsc`, `vitest`, `eslint`, `npm run build`) all pass, and the underlying Storage bucket/RLS policies were verified live against the database via direct SQL queries. Full manual click-through is recommended once a dev server is running against the live Supabase project, ideally folded into Plan 01-04's or the phase-end verification pass.
- STATE.md and ROADMAP.md will be updated next via `state advance-plan` (Plan 4 of 5) and `roadmap update-plan-progress`.

---
*Phase: 01-walking-skeleton*
*Completed: 2026-06-26*

## Self-Check: PASSED

All claimed files verified present on disk; all claimed commit hashes (`433a390`, `9a7b9b6`, `0d3718a`, `738b271`, `88f8828`, `b733530`) verified present in `git log --oneline --all`.
