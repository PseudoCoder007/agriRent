---
phase: 02
slug: equipment-booking-lifecycle-deepening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-27
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 1 set the precedent of `tsc --noEmit` + manual verification only, no test runner configured |
| **Config file** | none — Wave 0 requires no install (no automated framework introduced this phase per RESEARCH.md recommendation) |
| **Quick run command** | `npx tsc --noEmit -p tsconfig.json` |
| **Full suite command** | none configured — manual verification pass per the table below substitutes for a full suite |
| **Estimated runtime** | ~10-20 seconds (typecheck only) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit -p tsconfig.json`
- **After every plan wave:** Run `npx tsc --noEmit -p tsconfig.json` (no broader automated suite exists to run)
- **Before `/gsd-verify-work`:** Full manual verification pass per the Per-Task Verification Map below must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-XX-XX | TBD | TBD | EQUIP-02 | Owner A edits/deletes Owner B's equipment via forged equipmentId | Service layer re-fetches `owner_id` and compares to session before write; RLS `owns_equipment()` is second gate | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |
| 02-XX-XX | TBD | TBD | EQUIP-03 | Soft-deleted equipment still reachable by URL/ID | All equipment-read service functions apply `deleted_at IS NULL` filter; non-owner access to soft-deleted row 404s | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |
| 02-XX-XX | TBD | TBD | EQUIP-05 | Filter bypass / raw SQL in component | `searchParams`-driven filtering goes through `listingService.getAllEquipment(filters)`, never a direct Supabase query in the page | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |
| 02-XX-XX | TBD | TBD | EQUIP-07 | Forgetting RLS on new `favorites` table | `ENABLE ROW LEVEL SECURITY` in same migration statement block as `CREATE TABLE public.favorites` | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |
| 02-XX-XX | TBD | TBD | BOOK-05 | Arbitrary status jump (e.g. pending -> completed) via crafted request | `VALID_TRANSITIONS` lookup table checked server-side in every transition function; DB-level `BEFORE UPDATE` trigger as second enforcement layer | manual + typecheck | `npx tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs/Plan/Wave columns are TBD pending the planner's actual task breakdown — the planner must reconcile this table's rows against its real task IDs.*

---

## Wave 0 Requirements

- Existing infrastructure (`tsc --noEmit`) covers all phase requirements — no new test framework, fixtures, or config installs needed this phase per RESEARCH.md's explicit recommendation (treat automated testing as out-of-scope for Phase 2 unless CONTEXT.md says otherwise).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Owner cannot edit/delete another owner's listing | EQUIP-02 | No automated test framework configured this phase | Log in as Owner A, attempt to edit/delete Owner B's equipment via direct Server Action call (not just hidden UI); confirm rejection |
| Soft-deleted equipment hides from browse but booking history survives | EQUIP-03 | No automated test framework configured this phase | Delete equipment with an existing booking; confirm it disappears from browse/search but the farmer's dashboard still renders the booking without crashing |
| Category + location filters narrow browse results | EQUIP-05 | No automated test framework configured this phase | Apply category filter, confirm only matching rows render; apply location text filter, confirm partial/case-insensitive match works |
| Favorite/unfavorite persists and is retrievable | EQUIP-07 | No automated test framework configured this phase | Favorite an item, navigate away, return to `/farmer/favorites`, confirm it's listed; unfavorite, confirm it's removed |
| Booking status transitions are server-enforced, no arbitrary jumps | BOOK-05 | No automated test framework configured this phase | Attempt direct Server Action call to mark a `pending` booking `completed` (skipping `approved`) — confirm rejection; attempt a double-cancel — confirm the second attempt is a no-op/error, not a silent success |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
