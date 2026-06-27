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
- [x] **Phase 2.1: Mobile Responsiveness, Persistent AgriMate AI Chat, Bug Fixes, Dark Mode (INSERTED)** - Mobile nav/dashboard responsiveness, persistent per-user chat history, two confirmed bug fixes, light/dark mode toggle (gap closure in progress: mobile nav drawer close-on-navigate fix) (completed 2026-06-27)
- [ ] **Phase 3: Reviews & Dashboard/Notification Richness** - Completed bookings unlock reviews; dashboards and notifications become live and informative
- [ ] **Phase 3.1: Auth & Navigation UI Fixes (INSERTED)** - Fix dark-mode CSS variable bleed-through on forced-light pages, redesign login/signup visual design, rebuild role-scoped nav as a structured layout
- [ ] **Phase 3.2: AgriMate AI Brand Identity & Chat Polish (INSERTED)** - Custom brand mark used consistently across nav, chat, and favicon; branded chat avatar + animated typing indicator
- [ ] **Phase 3.3: Owner Listing Cleanup & Forced-Light Auth Fixes (INSERTED)** - Soft-deleted owner listings disappear from the dashboard, a persistent add-equipment CTA stays visible, and auth/home pages stay white after logout
- [x] **Phase 03.4: User Profile Management (INSERTED)** - View/edit display name, upload/change profile photo, add/edit phone number (completed 2026-06-27)
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

**Plans**: 4 plans

Plans:

- [ ] 02-01: Schema migration — favorites table + RLS, equipments.deleted_at, bookings status-transition trigger; push to live Supabase + regenerate types [BLOCKING]
- [ ] 02-02: Equipment edit/delete (soft-delete) + server-side category/location browse filter
- [ ] 02-03: Favorites (save/list) — farmer can favorite equipment and find it again on a dedicated page
- [ ] 02-04: Booking completed/cancelled state machine — service-layer VALID_TRANSITIONS guard, farmer self-cancel RLS policy, dashboard UI for both roles

### Phase 02.1: Mobile responsiveness, persistent AgriMate AI chat, multi-listing bug, listing image bug, and dark mode (INSERTED)

**Goal**: The app is usable on narrow viewports, the AgriMate AI chat assistant remembers a user's conversation across reloads and is consistently branded, owners can list equipment repeatedly without dead-ending, the owner dashboard shows equipment photos, and both roles can toggle light/dark mode.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MOBILE-01, MOBILE-02, CHAT-PERSIST-01, CHAT-BRAND-01, BUG-LISTING-01, BUG-IMAGE-01, THEME-01
**Success Criteria** (what must be TRUE):

  1. On viewports narrower than 640px, the farmer and owner header nav collapses behind a hamburger trigger with no link overflow/clipping, and dashboard booking rows stack instead of cramping.
  2. A user's AgriMate AI chat conversation survives a full page reload and navigating away and back, scoped to their own account only (RLS-enforced).
  3. Every UI location showing the chat assistant's name displays "AgriMate AI" / "Your Smart Farming Assistant", not the old "AgriRent Assistant" label.
  4. An owner can create a second (and subsequent) equipment listing and land on /owner/dashboard seeing all their listings with photos, not bounced back to /browse with text-only rows.
  5. A farmer or owner can toggle light/dark mode from their header, and the choice persists across a full browser reload.

**Plans**: 6 plans
Plans:
**Wave 1**

- [x] 02.1-01: Chat persistence backend — chat_messages migration + push [BLOCKING], chat.service.ts, chat.actions.ts, unit tests
- [x] 02.1-02: Bug fixes — multi-listing redirect, owner dashboard equipment thumbnails, dashboard row mobile wrap, token-based empty-state CTAs
- [x] 02.1-03: Dark mode — ThemeProvider, ThemeToggle, wired into farmer/owner headers

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02.1-04: Mobile nav collapse — shadcn Sheet drawer for farmer/owner headers below 640px
- [x] 02.1-05: Chat widget persistence wiring + AgriMate AI rebrand

**Gap closure** *(from 02.1-VERIFICATION.md MOBILE-01 gap / 02.1-REVIEW.md CR-01)*

- [x] 02.1-06: Mobile nav drawer close-on-navigate fix — wrap nav Links in SheetClose (farmer + owner layouts), add SheetTitle for accessibility (WR-06)

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

### Phase 03.4: User Profile Management (INSERTED)

**Goal**: A logged-in user can see their real display name and edit their profile — name, profile photo, and phone number — instead of only seeing a static role label ("farmer"/"owner") with no way to edit anything.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: PROFILE-01, PROFILE-02, PROFILE-03
**Success Criteria** (what must be TRUE):

  1. The logged-in user's actual display name (not just their role label) is visible in the nav/header for both farmer and owner roles.
  2. A user can open a profile page/section, edit their display name, and save the change — it persists and is reflected immediately in the UI.
  3. A user can upload or replace their profile photo (validated MIME type/size, stored in Supabase Storage) and it renders wherever their profile/avatar is shown.
  4. A user can add or edit a phone number on their profile, validated server-side via Zod, and it persists across sessions.

**Plans**: 3 plans

Plans:

**Wave 1**

- [x] 03.4-01: Schema migration — phone/avatar_url/avatar_updated_at columns + avatars Storage bucket + RLS; push to live Supabase + regenerate types [BLOCKING]; profile.schema.ts validation contracts

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03.4-02: Display name + phone vertical slice — profile.service.ts/profile.actions.ts, ProfileForm, AccountMenu, profile pages, role layout wiring (PROFILE-01, PROFILE-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03.4-03: Profile photo upload vertical slice — uploadAvatar/getAvatarUrl, uploadAvatarAction, AvatarUpload component, wired into ProfileForm + AccountMenu (PROFILE-02)

### Phase 3.1: Auth & Navigation UI Fixes (INSERTED)

**Goal**: Auth/home pages stay fully legible regardless of the user's dark-mode preference, login/signup have a polished cohesive design instead of bug-patched defaults, and role-scoped navigation (desktop + mobile) is restructured into a clear sidebar-style layout instead of a flat link row.
**Mode:** mvp
**Depends on**: Phase 2.1
**Requirements**: UI-AUTH-01, UI-AUTH-02, NAV-01
**Success Criteria** (what must be TRUE):

  1. With dark mode toggled on, the login, signup, forgot-password, reset-password, and home pages remain fully legible — labels, input borders, placeholders, and dividers are visible, not just the page background. Root cause (CSS custom property inheritance from `.dark` ancestor) is fixed at the source, not patched per-field.
  2. Login and signup pages have a deliberately designed layout/visual treatment (spacing, hierarchy, color use), not just visible-but-unstyled inputs.
  3. Farmer and owner role-scoped navigation (desktop header and mobile Sheet drawer) is restructured: theme toggle + notification bell share a top utility row, nav links occupy the main content area with clear spacing, and logout is pinned at the bottom — applied consistently to both roles.

**Plans**: 3 plans

Plans:

- [ ] 03.1-01: Fix dark-mode CSS bleed-through via .force-light class (UI-AUTH-01)
- [ ] 03.1-02: Redesign login/signup visual styling (UI-AUTH-02)
- [ ] 03.1-03: Restructure farmer/owner nav into 3-zone sidebar layout (NAV-01)

### Phase 3.2: AgriMate AI Brand Identity & Chat Polish (INSERTED)

**Goal**: AgriRent has one consistent custom "AgriMate AI" brand mark used across the nav header, the chat widget, and the site favicon/app icon, and the chat widget feels like a polished assistant surface (branded avatar, animated typing state, "Chat with AgriMate AI" header) instead of an emoji placeholder.
**Mode:** mvp
**Depends on**: Phase 2.1
**Requirements**: BRAND-01, CHAT-UX-01
**Success Criteria** (what must be TRUE):

  1. A single shared brand-mark component renders the AgriMate AI logo (with navbar/avatar/favicon variants as needed) and is the only place the logo's SVG markup is defined — no duplicate inline logo markup elsewhere.
  2. The site favicon and Apple touch icon both render the brand mark at a correct, non-blurry size for their respective surfaces (browser tab vs. iOS home screen).
  3. The chat widget header shows the brand mark and the text "Chat with AgriMate AI" (not the 🥇 emoji or any other placeholder), every assistant message shows the branded avatar, and a visible animated indicator displays while the assistant is generating a response.

**Plans**: 1 plan (retroactive — most scope already shipped via parallel work; this plan documents it and implements the one remaining gap: apple-icon 180x180 sizing)

Plans:

- [ ] 03.2-01: Retroactive brand-mark/chat-polish documentation + apple-icon 180x180 fix + full BRAND-01/CHAT-UX-01 verification pass (BRAND-01, CHAT-UX-01)

### Phase 3.3: Owner Listing Cleanup & Forced-Light Auth Fixes (INSERTED)

**Goal**: Deleted equipment disappears from the owner dashboard after refresh, owners always have a clear path to add another item, and the auth/home pages stay light after logout even if the user previously enabled dark mode.
**Mode:** mvp
**Depends on**: Phase 3.1 and Phase 2.1
**Requirements**: BUG-DELETE-01, BUG-LISTING-02, UI-AUTH-03
**Success Criteria** (what must be TRUE):

  1. After an owner deletes a listing, the item no longer appears in the owner dashboard on refresh, while the public browse/detail pages still treat the deleted listing as unavailable.
  2. The owner dashboard always exposes a visible "List equipment" action, even when the owner already has active listings.
  3. Logging out from a dark-mode session does not leave login/signup/forgot-password/reset-password/home rendered with dark surfaces or unreadable text.

**Plans**: 3 plans

Plans:

- [ ] 03.3-01: Hide soft-deleted owner listings from the dashboard read path and keep public 404 behavior intact
- [ ] 03.3-02: Add a persistent owner-dashboard "List equipment" CTA so owners can add another item at any time
- [ ] 03.3-03: Force auth/home pages back to light mode and record each bug in `.planning/debug/`

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
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 3.1 → 3.2 → 3.3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Walking Skeleton | 5/5 | Complete   | 2026-06-26 |
| 2. Equipment & Booking Lifecycle Deepening | 0/4 | Not started | - |
| 2.1. Mobile Responsiveness, Persistent Chat, Bug Fixes, Dark Mode | 6/6 | Complete    | 2026-06-27 |
| 3. Reviews & Dashboard/Notification Richness | 0/TBD | Not started | - |
| 03.4. User Profile Management (INSERTED) | 3/3 | Complete   | 2026-06-27 |
| 3.1. Auth & Navigation UI Fixes (INSERTED) | 0/3 | Not started | - |
| 3.2. AgriMate AI Brand Identity & Chat Polish (INSERTED) | 0/1 | Not started | - |
| 3.3. Owner Listing Cleanup & Forced-Light Auth Fixes (INSERTED) | 0/3 | Not started | - |
| 4. UI/Design Polish | 0/TBD | Not started | - |
