# Phase 3 Research

## What Already Exists

- Completed booking states are already available in the phase 2 schema and service layer.
- Notifications already exist as a row-based table with server-side insert/read services.
- Role-specific dashboard routes already exist, so phase 3 can enrich those pages instead of introducing a new navigation surface.
- Supabase Realtime is enabled in `supabase/config.toml`, so a client-side subscription path is available without adding a new infrastructure layer.

## Gaps

- There is no reviews table, review service, review action, or review validation yet.
- Equipment detail pages do not show trust signals such as average rating or review list.
- Dashboard pages are still mostly lists; they need aggregate summaries and recent activity sections.
- Notifications are static lists only; there is no bell, unread count, or live update flow yet.

## Locked Direction

- Reviews are create-only in this phase.
- The review write path must be server-verified against a completed booking and the authenticated farmer.
- Dashboard enrichment should stay inside the existing owner/farmer routes.
- Live notifications should use Supabase Realtime from the client, not a new backend worker or websocket service.

## Assumptions

- `notifications.read` remains the unread source of truth.
- Review averages can be computed from the reviews table at query time.
- Existing notification inserts remain the same; only read/unread presentation changes.
