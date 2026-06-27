# Phase 3: Reviews, Dashboard, and Notification Richness - Pattern Map

**Mapped:** 2026-06-27
**Purpose:** Capture the existing code paths Phase 3 should extend, so the planner can add reviews and live notifications without inventing a new architecture.

## Current Anchors

- `src/app/(farmer)/equipment/[id]/page.tsx` - equipment detail page; currently shows listing data and booking request UI, but no review summary or review form.
- `src/app/(owner)/owner/dashboard/page.tsx` - owner dashboard; currently shows equipment, booking requests, active bookings, and plain-list notifications.
- `src/app/(farmer)/farmer/dashboard/page.tsx` - farmer dashboard; currently shows booking history and plain-list notifications.
- `src/app/(owner)/layout.tsx` and `src/app/(farmer)/layout.tsx` - role-scoped layouts; best place for a shared notification bell.
- `src/lib/services/notification.service.ts` - existing notification read/write service boundary; should be extended for unread counts and mark-read behavior.
- `supabase/migrations/0005_phase2_schema.sql` and `types/database.ts` - phase 2 schema baseline; completed bookings already exist, which makes review gating possible.

## Likely Additions

- `supabase/migrations/0006_phase3_reviews.sql` - reviews table, uniqueness guard, RLS, and any Realtime publication adjustment needed for notifications.
- `src/lib/services/review.service.ts` - server-side review creation/read helpers.
- `src/lib/validations/review.schema.ts` - shared Zod validation for rating/comment payloads.
- `src/app/actions/review.actions.ts` - thin server actions for review creation.
- `src/app/actions/notification.actions.ts` - mark-read action and any unread list refresh hooks.
- `src/components/notifications/NotificationBell.tsx` - live bell with unread count, recent notifications, and Realtime subscription.

## Extension Rules

- Reviews must be anchored to a real completed booking, never just an equipment row.
- Dashboard enrichment should compute aggregates on read; do not store redundant summary columns unless the plan explicitly introduces them.
- Notification Realtime should be client-side only, with the server still responsible for reads and mark-read mutations.
- Keep all new mutations behind service functions and thin server actions, matching the rest of the app.
