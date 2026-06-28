---
phase: 03-reviews-dashboard-notification-richness
verified: 2026-06-27T18:15:00Z
status: gaps_found
score: 3/4 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Owner and farmer dashboards show richer history/stats drawing on bookings, reviews, and notifications"
    status: partial
    reason: "Both dashboards show stat cards (pending/approved/completed/cancelled counts) and a 'Recent Activity' feed sourced from notifications, plus the booking list itself — clearly richer than a bare list. However neither dashboard references reviews in any way: no 'reviews you've left' on the farmer side, no 'reviews received across your equipment' / average-rating rollup on the owner side. The ROADMAP success criterion explicitly names reviews as one of the three data sources the richer dashboards should draw on, and review.service.ts (getAverageRating, getReviewsForEquipment) is never imported by either dashboard page."
    artifacts:
      - path: "src/app/(farmer)/farmer/dashboard/page.tsx"
        issue: "Imports bookingService and notificationService only; no reviewService import or review-derived data anywhere on the page"
      - path: "src/app/(owner)/owner/dashboard/page.tsx"
        issue: "Imports listingService, bookingService, notificationService only; no reviewService import, no per-equipment or aggregate rating shown to the owner anywhere in the app"
    missing:
      - "A reviews-derived section/stat on at least one dashboard (e.g. farmer: 'Reviews you've left' count/list; owner: average rating across listings or count of reviews received) to satisfy the roadmap's explicit three-source requirement"
  - truth: "Plan 03-02's own verification step (Vitest coverage for review creation and read helpers) was completed"
    status: failed
    reason: "03-02-PLAN.md explicitly requires 'Add Vitest coverage for review creation and read helpers' under its Verification section. No test file exists for review.service.ts anywhere in the repo (confirmed via `vitest list` showing zero review-related test entries, and no review.service.test.ts file on disk), unlike every other service in the codebase (ai, auth, booking, chat) which all have adjacent *.test.ts files."
    artifacts:
      - path: "src/lib/services/review.service.ts"
        issue: "No corresponding review.service.test.ts exists; createReview, getEligibleBooking, getAverageRating, getReviewsForEquipment are all untested"
    missing:
      - "src/lib/services/review.service.test.ts with coverage for: reject non-completed booking, reject duplicate review, accept valid completed-booking review, average rating computation"
deferred: []
---

# Phase 3: Reviews & Dashboard/Notification Richness Verification Report

**Phase Goal:** Farmers can leave trustworthy reviews tied to real completed bookings, equipment pages show that trust signal, and both dashboards plus the notification system feel like a finished product rather than a bare list.
**Verified:** 2026-06-27T18:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Important Context

This phase was never executed through the normal GSD execute-phase flow. The 03-01 through 03-04 PLAN.md files in this directory are lightweight stubs describing original intent; the actual implementation shipped in a single large non-GSD-tracked commit `abc1c6d` ("feat: ship recent AgriRent updates"), bundled together with unrelated Phase 2 work (favorites, equipment edit/delete) and a separate notification-bell bugfix landing later in `506c422`. No `*-SUMMARY.md` files exist for this phase, so this verification is based entirely on direct codebase inspection plus a live Supabase migration-state check — not on any executor self-report.

Also note: ROADMAP.md's checkbox for "Phase 2: Equipment & Booking Lifecycle Deepening" still shows `[ ]` (not started) and its plans are unchecked, even though Phase 2's functionality (equipment edit/delete, favorites, completed/cancelled booking transitions) is clearly present and working in the codebase as a prerequisite dependency for this phase's reviews feature. This is a roadmap bookkeeping inconsistency outside this verification's scope, noted here for traceability since Phase 3 depends on Phase 2.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|---|---|---|
| 1 | A farmer can leave a rating and review only for a booking whose status is `completed` — rejected server-side, not just hidden in UI | VERIFIED | Triple-layered enforcement: (a) `review.service.ts createReview` checks `booking.status !== "completed"` and returns a rejection before any insert; (b) the RLS policy `"reviews insert own completed"` in `0006_phase3_reviews.sql` requires `farmer_id = auth.uid() AND EXISTS (... status = 'completed')` as a `WITH CHECK` on INSERT — this is enforced at the database level regardless of which client issues the query; (c) no admin/service-role client is used anywhere in the review write path (`grep` for `createAdminClient`/`service_role` in review.service.ts and review.actions.ts returns nothing), so the RLS policy cannot be bypassed. Migration confirmed live via `supabase migration list` (local 0006 = remote 0006). |
| 2 | An equipment detail page shows its average rating and list of reviews | VERIFIED | `src/app/(farmer)/equipment/[id]/page.tsx` line 99 renders `<ReviewSection equipmentId={equipment.id} />`. `ReviewSection.tsx` calls `getReviewsForEquipment` and `getAverageRating` and renders `★ {average.toFixed(1)} ({reviews.length})` plus a full review list with reviewer name, star rating, and comment. Confirmed wired and rendering real data, not a stub. Note: this exists on the farmer-facing detail page only — there is no equivalent owner-facing equipment view page (owner only has `/equipment/[id]/edit`, which does not show reviews), so reviews are a farmer-only-visible trust signal. The roadmap criterion only requires "an equipment detail page," which is satisfied. |
| 3 | Owner and farmer dashboards show richer history/stats (not just a bare list) drawing on bookings, reviews, and notifications | PARTIAL / GAP | Both dashboards (`src/app/(farmer)/farmer/dashboard/page.tsx`, `src/app/(owner)/owner/dashboard/page.tsx`) show stat cards (counts by status, computed from real `bookingService` data) and a "Recent Activity" section sourced from `notificationService.getNotificationsForUser`, in addition to the booking list — this is clearly richer than Phase 1/2's bare list. However, **reviews are never referenced on either dashboard.** `review.service.ts` exports (`getAverageRating`, `getReviewsForEquipment`) are not imported by either dashboard page. The roadmap criterion explicitly names all three data sources (bookings, reviews, notifications) — reviews is the one entirely missing. See Gaps section. |
| 4 | Notifications update live via a client-side Supabase Realtime subscription (bell icon/unread count) instead of requiring a page reload | VERIFIED | `NotificationBell.tsx` opens a `supabase.channel(...)` subscription with `.on("postgres_changes", {event: "INSERT", table: "notifications", filter: "user_id=eq.${userId}"})` and updates `unreadCount`/`notifications` state on payload receipt — no polling, no reload required. RLS `"notifications select own"` policy (from Phase 1) is what makes the client-side filtered subscription secure. Wired into both farmer and owner layouts (desktop header + mobile Sheet drawer), passing the real authenticated `userId`. |

**Score:** 3/4 truths fully verified, 1 partial (richer-dashboards criterion missing the reviews data source)

### Bell Icon Bug Fix Verification (commit 506c422)

The pre-existing crash (`React Strict Mode double-invoke colliding with @supabase/realtime-js channel dedup`) is fixed soundly, not just patched around the symptom. The fix scopes the channel topic as `` `notifications-${userId}-${topicIdRef.current}` `` where `topicIdRef` is a `useRef(Math.random()...)` generated once per component instance. Because Strict Mode's double-mount creates two separate component instances (each with its own `topicIdRef`), each mount now gets a genuinely unique topic name — eliminating the dedup collision at its root cause rather than working around symptoms (e.g., a timeout/retry hack). This is a correct, durable fix.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/lib/services/review.service.ts` | Review CRUD + eligibility + rating aggregation | VERIFIED | All four functions present and substantive: `createReview`, `getReviewsForEquipment`, `getEligibleBooking`, `getAverageRating`. No stubs, no TODO/FIXME/placeholder markers found. |
| `src/app/actions/review.actions.ts` | Server Action wrapping the service with auth + Zod validation | VERIFIED | `createReviewAction` checks auth, parses with `createReviewSchema.safeParse`, calls service, revalidates the equipment path on success. |
| `src/lib/validations/review.schema.ts` | Zod schema with rating bounds | VERIFIED | `rating: z.coerce.number().int().min(1).max(5)`, `.strict()` object rejecting unknown fields (e.g. a client-submitted `farmerId` or `equipmentId` override attempt on rating itself is blocked by `.strict()` plus server always re-derives `equipment_id` from the booking row, never from client input). |
| `src/components/equipment/ReviewSection.tsx` | Server Component rendering reviews + average + conditional form | VERIFIED | Renders average rating, review list, and conditionally renders `ReviewForm` only when `getEligibleBooking` returns a result — eligibility gating happens server-side before the form is even sent to the client. |
| `src/components/equipment/ReviewForm.tsx` | Client form for rating + comment submission | VERIFIED | Real `<form onSubmit>` calling `createReviewAction`, star-rating picker, toast feedback on success/failure. Not a stub — full submit→server round trip. |
| `supabase/migrations/0006_phase3_reviews.sql` | reviews table + RLS + Realtime publication for notifications | VERIFIED | Table includes `UNIQUE (booking_id)` (one-review-per-booking, DB-enforced), `CHECK (rating >= 1 AND rating <= 5)` (DB-enforced rating bounds, redundant with but independent of the Zod check), the completed-booking INSERT policy, a public SELECT policy, and `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications`. **Confirmed pushed to the live/linked Supabase project** — `supabase migration list` shows Local 0006 = Remote 0006 (all 7 migrations match), and `types/database.ts` (regenerated from the live schema) contains a `reviews` table type definition. |
| `src/app/(farmer)/equipment/[id]/page.tsx` | Renders ReviewSection | VERIFIED | Line 99: `<ReviewSection equipmentId={equipment.id} />`, after the booking form. |
| `src/components/notifications/NotificationBell.tsx` | Client component, Realtime subscription, mark-read | VERIFIED | Fully wired: initial load via Server Action, live INSERT subscription, mark-all-read action, dropdown UI with unread badge. The Strict-Mode crash fix is sound (see above). |
| Owner-side review/rating display | Equivalent of ReviewSection on the owner side | MISSING (informational) | Confirmed via grep: no "review"/"rating"/"average" reference anywhere under `src/app/(owner)`. Not explicitly required by the roadmap wording ("equipment detail page" — singular, farmer-facing detail page exists), but noted since reviews are otherwise invisible to the party whose equipment is being reviewed. |
| `src/lib/services/review.service.test.ts` | Vitest coverage per 03-02-PLAN.md's own verification step | MISSING | No test file exists. `vitest list` (full enumeration, not filtered re-run) shows zero review-related entries; every other phase-1/2/2.1 service (`ai`, `auth`, `booking`, `chat`) has an adjacent `*.test.ts` file, making this omission visible by contrast. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ReviewForm.tsx` | `review.actions.ts` (`createReviewAction`) | `onSubmit` → `await createReviewAction(formData)` | WIRED | Awaited, response used to drive toast success/failure — not fire-and-forget. |
| `review.actions.ts` | `review.service.ts` (`createReview`) | direct function call after Zod parse | WIRED | Parsed input passed through; service result returned as-is to the client. |
| `review.service.ts` (`createReview`) | `bookings` table | `.eq("id", bookingId).eq("farmer_id", farmerId).single()` pre-check | WIRED | App-level pre-check exists for a friendly error message; DB RLS policy is the authoritative guard underneath it (defense in depth, correctly layered per CLAUDE.md's stated booking-integrity pattern). |
| `ReviewSection.tsx` | `review.service.ts` (`getReviewsForEquipment`, `getAverageRating`, `getEligibleBooking`) | direct async calls, `Promise.all` | WIRED | Real data flows into JSX — average computed from actual `reviews.rating` rows, not hardcoded. |
| `equipment/[id]/page.tsx` | `ReviewSection.tsx` | JSX render with real `equipmentId` prop | WIRED | Prop is the resolved equipment's real `id`, not a hardcoded/empty value. |
| `NotificationBell.tsx` | Supabase Realtime (`postgres_changes` INSERT on `notifications`) | `.channel(...).on(...).subscribe()` | WIRED | Filter scoped to the real authenticated `userId`; payload handler updates real component state (`setNotifications`, `setUnreadCount`), not a no-op. |
| `(farmer)/layout.tsx`, `(owner)/layout.tsx` | `NotificationBell` | JSX render passing `userData.user.id` | WIRED | Real authenticated user ID passed in both desktop header and mobile Sheet drawer instances. |
| `farmer/dashboard/page.tsx`, `owner/dashboard/page.tsx` | `review.service.ts` | — | NOT WIRED | No import, no call. This is the basis for the Gap recorded above. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `ReviewSection.tsx` | `reviews`, `average` | `reviewService.getReviewsForEquipment` / `getAverageRating` → live `reviews` table query | Yes — average is computed via `data.reduce(...)/data.length`, not a static value; empty-state ("No reviews yet") only shown when `data.length === 0` is genuinely true | FLOWING |
| `NotificationBell.tsx` | `notifications`, `unreadCount` | `getUnreadNotificationsAction` (initial) + live Realtime payload (ongoing) | Yes — initial load is a real filtered query (`read=false`, `limit(10)`); live updates come from genuine `postgres_changes` INSERT events, not a mock/interval | FLOWING |
| `farmer/dashboard/page.tsx`, `owner/dashboard/page.tsx` stat cards | `pendingCount`, `approvedCount`, `completedCount`, `cancelledCount` | `bookingService.getBookingsForFarmer`/`getBookingsForOwner` then `.filter()` | Yes — computed client-side-in-Server-Component from real fetched bookings array, not hardcoded | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| TypeScript compiles cleanly across the whole project (catches wiring/type drift introduced by the ad-hoc commit) | `npx tsc --noEmit` | No output / exit clean | PASS |
| Migration 0006 (reviews) is actually applied to the live/linked Supabase project, not just present on disk | `npx supabase migration list` | Local/Remote columns match through 0006 (all 7 migrations) | PASS |
| Existing test infrastructure is functional (rules out "tests can't run" as an excuse for the missing review tests) | `npx vitest run src/lib/services/booking.service.test.ts` | 1 file, 2 tests passed | PASS |
| A review.service test exists | `npx vitest list` (full enumeration) | Zero matches for "review" across all listed test names | FAIL — confirms the gap above |

### Probe Execution

SKIPPED — no `scripts/*/tests/probe-*.sh` convention or phase-declared probes found in this project; this phase uses Vitest + manual/live checks instead.

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|---|---|---|---|---|
| REVIEW-01 | Phase 3 | Farmer can leave a rating + review only for a booking with status `completed` | SATISFIED | Service-layer + RLS dual enforcement confirmed (Truth #1). DB CHECK constraint also enforces rating 1-5 independent of Zod. |
| REVIEW-02 | Phase 3 | Equipment detail page shows its average rating and reviews | SATISFIED | `ReviewSection` confirmed rendered and data-flowing on the farmer equipment detail page (Truth #2). |
| NOTIF-01 (re-check per phase 3 SC #4) | Phase 1 (richness re-checked here) | In-app notification + (per Phase 3 SC4) live Realtime bell/unread count | SATISFIED | Confirmed live subscription wired (Truth #4), plus the Strict-Mode crash bug that was blocking every page load is fixed at its root cause, not papered over. |

No orphaned requirements found — REQUIREMENTS.md maps only REVIEW-01 and REVIEW-02 to Phase 3 (NOTIF-01 is Phase 1, re-verified here per the task's explicit instruction), and both appear in the 03-01/03-02 PLAN frontmatter `requirements:` fields.

**REQUIREMENTS.md checkbox status note:** REQUIREMENTS.md currently shows `REVIEW-01` and `REVIEW-02` as `[ ] Pending` and the Traceability table lists both as "Pending." Given this verification's findings (both SATISFIED, with one test-coverage gap), these should be updated to `[x] Complete` once the gaps below are closed or explicitly accepted via override.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | None found | — | Scanned `review.service.ts`, `review.actions.ts`, `review.schema.ts`, `ReviewSection.tsx`, `ReviewForm.tsx`, `NotificationBell.tsx`, both dashboard pages for TODO/FIXME/XXX/TBD/HACK/PLACEHOLDER/"not yet implemented"/empty-handler patterns — none present. |

No debt-marker gate violations.

### Human Verification Required

None of the four roadmap success criteria require human-only judgment (visual polish is explicitly Phase 4's job, not Phase 3's). All four were verifiable via direct code/schema/migration-state inspection. No human verification items identified.

### Gaps Summary

Two gaps block a clean `passed` status, both narrow and fixable without re-architecting anything:

1. **Dashboards don't draw on reviews.** The roadmap success criterion explicitly lists three data sources (bookings, reviews, notifications) for the "richer dashboards" goal. Bookings and notifications are clearly integrated (stat cards + recent activity feed); reviews are not referenced at all on either dashboard. A minimal closure: add a "Reviews you've left" count/section to the farmer dashboard (querying reviews by `farmer_id`) and an aggregate rating/review-count to the owner dashboard (e.g. average across the owner's equipment, via `getAverageRating` per listing or a small aggregate query). This is the more substantive of the two gaps since it affects an explicit, named roadmap criterion.

2. **No Vitest coverage for review.service.ts.** The phase's own plan (03-02-PLAN.md) calls for this explicitly under its Verification section, and every comparable service in the codebase has equivalent coverage. This is a process/quality gap, not a functional one — the underlying behavior is correctly implemented and DB-enforced regardless, but the missing tests mean regressions in `createReview`/`getEligibleBooking`/`getAverageRating` would go undetected by the test suite.

Both gaps are narrow, additive, and do not require touching the schema, RLS policies, or any already-verified wiring. They are recorded as `gaps` (not `deferred`) because no later phase (4: UI/Design Polish) claims to cover dashboard data-source completeness or test coverage — Phase 4's goal is purely visual/UX polish on already-functional flows.

---

_Verified: 2026-06-27T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
