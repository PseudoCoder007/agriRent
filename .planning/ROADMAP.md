# Roadmap: AgriRent

## Overview

AgriRent goes from zero to a portfolio-ready farm equipment rental marketplace in four phases. Phase 1 builds a thin, fully-wired walking skeleton — auth, equipment, booking, notifications, and AI all running end-to-end together, with every critical trust-boundary fix (RLS recursion avoidance, DB-enforced double-booking prevention, server-computed pricing, pooled connections, AI error handling) built in from the start rather than retrofitted. Phase 2 deepens the core transaction loop: equipment management completion, search/filter, favorites, and the full booking lifecycle through completion/cancellation. Phase 3 unlocks reviews (which depend on completed bookings existing) and enriches both dashboards and notifications (moving to live Realtime updates). Phase 4 is dedicated UI/design polish, deliberately last, so visual work is never thrown away by functional changes underneath it.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Walking Skeleton** - Auth, equipment, booking, notifications, and AI chat all run end-to-end for one farmer and one owner account (completed 2026-06-26)
- [ ] **Phase 2: Equipment & Booking Lifecycle Deepening** - Owners manage listings fully, farmers search/filter/favorite, bookings reach completed/cancelled
- [ ] **Phase 3: Reviews & Dashboard/Notification Richness** - Completed bookings unlock reviews; dashboards and notifications become live and informative
- [ ] **Phase 4: UI/Design Polish** - The full app looks and feels presentable across every flow built in Phases 1-3

## Phase Details

### Phase 1: Walking Skeleton

**Goal**: A single farmer and a single owner account can sign up with roles, list one piece of equipment, request and approve one booking with a correct server-computed price and zero double-booking possibility, see one notification about it, and get one working answer from the AI chatbot — all on one deployed app.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, EQUIP-01, EQUIP-04, EQUIP-06, BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, DASH-01, DASH-02, NOTIF-01, AI-01, AI-02
**Success Criteria** (what must be TRUE):

  1. A user can sign up choosing farmer or owner, log in, stay logged in across a browser refresh, and log out from any page.
  2. An owner can create an equipment listing with title, description, category, rate, and a photo; a farmer can browse the flat listing and open a detail page showing photos, rate, owner, and description.
  3. A farmer can request a booking for a date range and the stored `total_amount` always matches server-side rate × duration regardless of what the client submitted; a second overlapping booking request for the same equipment is rejected at the database level (Postgres `EXCLUDE` constraint), not just by application logic.
  4. An owner can approve or reject a pending booking from a bare-minimum dashboard, and the booking's status only ever moves pending → approved/rejected via server-enforced logic; a farmer can see their booking history and current status on their own dashboard.
  5. A notification row appears (as a plain list) when a booking is created, approved, or rejected; either user can ask the AI chatbot a rental FAQ question and get a real response from NVIDIA NIM, and the chatbot never writes to `bookings` or `equipments`.

**Plans**: 5 plans

Plans:

- [x] 01-01: Scaffold project, push DB schema + RLS + EXCLUDE constraint to live Supabase [BLOCKING]
- [x] 01-02: Auth + role boundary (signup/login/logout, role-scoped route groups)
- [x] 01-03: Listing service (owner create, farmer browse + detail)
- [x] 01-04: AI chatbot (/api/chat + dedicated /chat route, NVIDIA NIM)
- [x] 01-05: Booking + notification + dashboards (server-computed price, EXCLUDE-guarded, approve/reject)

### Phase 2: Equipment & Booking Lifecycle Deepening

**Goal**: Owners have full control over their listings, farmers can narrow down equipment by category/location and save favorites, and bookings can reach a true terminal state (completed or cancelled) rather than stopping at approved/rejected.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: EQUIP-02, EQUIP-03, EQUIP-05, EQUIP-07, BOOK-05 (completed/cancelled transitions)
**Success Criteria** (what must be TRUE):

  1. An owner can edit and delete their own equipment listings, and cannot edit or delete another owner's listing (verified server-side, not just hidden in the UI).
  2. A farmer can filter the equipment browse page by category and by location (text/region match) and get narrowed results.
  3. A farmer can save/favorite a piece of equipment and find it again later.
  4. A booking can be explicitly marked completed or cancelled, with each transition still server-enforced against the booking's current status (no arbitrary status jumps).

**Plans**: 3 plans

Plans:

- [ ] 02-01: Schema migration — favorites table + RLS, equipments.deleted_at, bookings status-transition trigger; push to live Supabase + regenerate types [BLOCKING]
- [ ] 02-02: Equipment edit/delete (soft-delete) + server-side category/location browse filter
- [ ] 02-03: Favorites (save/list) + booking completed/cancelled state machine on both dashboards

### Phase 3: Reviews & Dashboard/Notification Richness

**Goal**: Farmers can leave trustworthy reviews tied to real completed bookings, equipment pages show that trust signal, and both dashboards plus the notification system feel like a finished product rather than a bare list.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: REVIEW-01, REVIEW-02
**Success Criteria** (what must be TRUE):

  1. A farmer can leave a rating and review only for a booking whose status is `completed` — a direct request against a pending/approved/cancelled booking is rejected server-side, not just hidden in the UI.
  2. An equipment detail page shows its average rating and list of reviews.
  3. Owner and farmer dashboards show richer history/stats (not just a bare list) drawing on bookings, reviews, and notifications now that all three exist with real data.
  4. Notifications update live via a client-side Supabase Realtime subscription (bell icon/unread count) instead of requiring a page reload.

**Plans**: TBD

Plans:

- [ ] 03-01: TBD

### Phase 4: UI/Design Polish

**Goal**: The application is visually presentable and consistent across every flow already built — auth, browse/detail, booking, dashboards, reviews, notifications, and AI chat — suitable as a portfolio/demo piece.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: (none — this phase polishes existing functional requirements, it does not add new ones)
**Success Criteria** (what must be TRUE):

  1. Every screen built in Phases 1-3 (auth, browse, detail, booking, dashboards, reviews, chat) follows a consistent visual design system (Shadcn UI + Tailwind) rather than default/unstyled markup.
  2. The app is usable and legible on both desktop and mobile viewport widths.
  3. Loading, empty, and error states (e.g., no listings yet, AI chatbot busy, booking conflict) are designed, not raw/default browser output.

**Plans**: TBD

Plans:

- [ ] 04-01: TBD

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Walking Skeleton | 5/5 | Complete   | 2026-06-26 |
| 2. Equipment & Booking Lifecycle Deepening | 0/3 | Not started | - |
| 3. Reviews & Dashboard/Notification Richness | 0/TBD | Not started | - |
| 4. UI/Design Polish | 0/TBD | Not started | - |
