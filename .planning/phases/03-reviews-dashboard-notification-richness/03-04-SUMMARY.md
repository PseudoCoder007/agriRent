---
phase: 03-reviews-dashboard-notification-richness
plan: 04
subsystem: ui
tags: [supabase-realtime, react, notifications]

requires:
  - phase: 01
    provides: notifications table and notification.service.ts row inserts on status transitions
provides:
  - "NotificationBell client component: bell icon, unread count badge, dropdown list, live postgres_changes subscription"
  - "markNotificationsReadAction -- decrements unread count without a page reload"
affects: []

tech-stack:
  added: []
  patterns: ["Realtime channel topic must be scoped per mount instance (userId + random suffix), not a fixed string -- a fixed topic collides with @supabase/realtime-js's channel dedup under React Strict Mode's double-effect-invoke in dev, throwing on every page load"]

key-files:
  created:
    - src/components/notifications/NotificationBell.tsx
  modified:
    - src/app/(farmer)/layout.tsx
    - src/app/(owner)/layout.tsx
    - src/app/actions/notification.actions.ts

key-decisions:
  - "Unread count derived from the notifications table's read boolean field, not a separate counter table, per original plan constraint"
  - "No websocket server or background worker -- client subscribes directly to Supabase Realtime, consistent with Vercel Hobby plan's no-persistent-connection constraint"

patterns-established:
  - "Any future Supabase Realtime channel() call in a client component must scope its topic name uniquely per mount (see fix in commit 506c422) to avoid the Strict-Mode double-effect collision"

requirements-completed: []

duration: unknown (built outside GSD execution tracking)
completed: 2026-06-27
---

# Phase 3: Live Notifications Summary

**NotificationBell with a live Supabase Realtime postgres_changes subscription, unread-count badge, and mark-read action -- wired into both farmer and owner headers; a real Strict-Mode/Realtime-dedup crash discovered and fixed post-hoc**

## Performance

- **Duration:** Unknown -- built and shipped in commit `abc1c6d` outside GSD execute-phase tracking. This SUMMARY.md is a retroactive reconstruction written during `/gsd-discuss-phase 3` after discovering the phase was already substantially built.
- **Completed:** 2026-06-27 (commit date); bugfix completed same day in commit `506c422`

## Accomplishments
- `NotificationBell` subscribes to `postgres_changes` INSERT events on the `notifications` table, filtered to the current user, and prepends new rows to the dropdown list live
- Unread count badge updates immediately on new notification and decrements via `markNotificationsReadAction` without a page reload
- Component rendered in both `(farmer)/layout.tsx` and `(owner)/layout.tsx`, in both the desktop header and the mobile Sheet drawer footer controls

## Files Created/Modified
- `src/components/notifications/NotificationBell.tsx` - bell icon, dropdown, Realtime subscription
- `src/app/(farmer)/layout.tsx`, `src/app/(owner)/layout.tsx` - component placement
- `src/app/actions/notification.actions.ts` - `getUnreadNotificationsAction`, `markNotificationsReadAction`

## Decisions Made
- Read-field-derived unread count (no separate counter table), no background worker -- both per original plan constraints

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Realtime channel crashed on every page load under React Strict Mode**
- **Found during:** Live manual verification of an unrelated gap-closure plan (02.1-06) on 2026-06-27, when the bug blocked browser testing entirely
- **Issue:** `@supabase/realtime-js`'s `channel()` dedupes by topic name. React Strict Mode's dev-only double-effect-invoke (mount → cleanup → mount) could hand the second mount the still-joining channel object from the first mount before `removeChannel()` cleanup completed, throwing "cannot add postgres_changes callbacks ... after subscribe()" as an uncaught runtime error on every page load.
- **Fix:** Scoped the channel topic per mount instance (`notifications-${userId}-${randomSuffix}` via `useRef`), eliminating the name collision entirely.
- **Files modified:** `src/components/notifications/NotificationBell.tsx`
- **Verification:** Live-verified in browser post-fix -- no console errors, bell/notifications work correctly across repeated navigations
- **Committed in:** `506c422` (same day, found during an unrelated phase's verification session)

---

**Total deviations:** 1 auto-fixed (1 blocking — real runtime crash, only surfaced by live browser testing, not by tsc/static analysis)
**Impact on plan:** Necessary correctness fix; the feature was otherwise built exactly as the plan describes.

## Issues Encountered
- See deviation above -- the bug was discovered incidentally while verifying a different gap-closure plan, not during this phase's own original (untracked) build.

## Next Phase Readiness
- NotificationBell is stable and ready for use by any future phase needing live notification UI

---
*Phase: 03-reviews-dashboard-notification-richness*
*Completed: 2026-06-27*
