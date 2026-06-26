# Requirements: AgriRent

**Defined:** 2026-06-26
**Core Value:** A farmer can find available equipment near them and successfully book it for a date range, and the owner can approve or reject that request — end to end, with no double-booking and no client-side price tampering.

## v1 Requirements

Requirements for the initial release (Phase 1 walking skeleton + its immediate deepening). Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up and log in as either a farmer or an equipment owner, with role chosen at signup
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: User can log out from any page

### Equipment

- [x] **EQUIP-01**: Owner can create an equipment listing with title, description, category, hourly/daily rate, and at least one photo
- [ ] **EQUIP-02**: Owner can edit their own equipment listings
- [ ] **EQUIP-03**: Owner can delete their own equipment listings
- [x] **EQUIP-04**: Farmer can browse all equipment listings
- [ ] **EQUIP-05**: Farmer can filter equipment by category and location (text/region match)
- [x] **EQUIP-06**: Farmer can view full equipment detail (photos, rate, owner, description)
- [ ] **EQUIP-07**: Farmer can save/favorite equipment for later

### Booking

- [ ] **BOOK-01**: Farmer can request a booking for a piece of equipment for a specific date range
- [ ] **BOOK-02**: System rejects booking requests that overlap an existing pending/approved booking for the same equipment — enforced at the database level (not just application logic), to close concurrent-request race conditions
- [ ] **BOOK-03**: `total_amount` is computed server-side from the equipment's stored rate; the client-submitted price is never trusted
- [ ] **BOOK-04**: Owner can approve or reject a pending booking request
- [ ] **BOOK-05**: Booking status follows pending → approved/rejected → completed/cancelled, with transitions enforced server-side
- [ ] **BOOK-06**: Farmer can view their own booking history and current status

### Dashboards

- [ ] **DASH-01**: Owner dashboard shows their equipment, incoming booking requests, and active bookings
- [ ] **DASH-02**: Farmer dashboard shows their booking history and current status

### Reviews

- [ ] **REVIEW-01**: Farmer can leave a rating + review only for a booking with status `completed`
- [ ] **REVIEW-02**: Equipment detail page shows its average rating and reviews

### Notifications

- [ ] **NOTIF-01**: User receives an in-app notification when a booking is created, approved, rejected, or completed

### AI

- [x] **AI-01**: Any logged-in user can ask the AI chatbot rental-related questions (how to book, deposit policy, etc.) and get a response from the NVIDIA NIM-backed assistant
- [x] **AI-02**: The AI chatbot is strictly advisory — it never writes to `bookings` or `equipments` tables directly

## v2 Requirements

Deferred to the next release after v1 ships. Tracked but not in current roadmap.

### Payments & Communication

- **PAY-01**: Payment gateway integration (Razorpay) with deposit/escrow handling — separate compliance/trust surface from the booking-approval flow; build once v1's approval flow is proven
- **CHAT-01**: Real-time chat between owner and farmer — needs an infra upgrade beyond Vercel Hobby's serverless execution limits (or a Realtime-channel-based redesign); in-app notifications cover v1
- **NOTIF-02**: SMS notifications — needs a paid SMS gateway; in-app notifications suffice until then

### Trust & Engagement

- **TRUST-01**: Verified/trusted owner badge after N completed bookings with good ratings
- **TRUST-02**: "Rebook this equipment" shortcut for repeat renters

### AI Deepening

- **AI-03**: AI-assisted equipment recommendations based on booking/review history
- **AI-04**: AI-assisted dynamic pricing *suggestions* for owners — suggestion only, owner always confirms the final rate, never auto-applied (preserves the core "no price tampering" guarantee)

### Domain-Specific

- **EQUIP-08**: Operator-included / "equipment + operator" booking flag on listings (schema field reserved cheaply now; matching/assignment logic deferred)

### Search Deepening

- **SEARCH-01**: Geo-radius / map-based search ("equipment within N km") using stored lat/lng

## v3 Requirements

Longer-term, higher-complexity, or higher-risk. Revisit only if the project moves toward a real commercial product.

- **GPS-01**: Live GPS / fleet tracking of equipment — needs hardware/IoT integration this project doesn't control
- **KYC-01**: Full KYC / government ID verification of owners and farmers — compliance/cost disproportionate until there's real money/liability on the platform
- **I18N-01**: Multi-language / voice interface for rural farmers — high real-world value, but a large dedicated effort on its own
- **AI-05**: AI-assisted booking creation or price-setting on a user's behalf — **must stay human-in-the-loop even at v3**: the AI may draft/propose a booking or price, but a human (farmer or owner) must explicitly confirm before anything writes to `bookings` or `equipments`. Fully autonomous AI writes would break the platform's core no-tampering guarantee and is not approved at any version.

## Out of Scope

Explicitly excluded, not just deferred. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Buy/sell used equipment marketplace | Different transaction model (one-time sale vs. recurring rental) with different legal/trust requirements; stay strictly rental-only |
| Government subsidy integration | Not core to a rental marketplace; would require government API/data partnerships outside this project's control |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| EQUIP-01 | Phase 1 | Complete |
| EQUIP-02 | Phase 2 | Pending |
| EQUIP-03 | Phase 2 | Pending |
| EQUIP-04 | Phase 1 | Complete |
| EQUIP-05 | Phase 2 | Pending |
| EQUIP-06 | Phase 1 | Complete |
| EQUIP-07 | Phase 2 | Pending |
| BOOK-01 | Phase 1 | Pending |
| BOOK-02 | Phase 1 | Pending |
| BOOK-03 | Phase 1 | Pending |
| BOOK-04 | Phase 1 | Pending |
| BOOK-05 | Phase 1 (pending/approved/rejected) + Phase 2 (completed/cancelled) | Pending |
| BOOK-06 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| REVIEW-01 | Phase 3 | Pending |
| REVIEW-02 | Phase 3 | Pending |
| NOTIF-01 | Phase 1 | Pending |
| AI-01 | Phase 1 | Complete |
| AI-02 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 23 total
- Mapped to phases: 23/23 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 after roadmap creation (4 phases, full coverage)*
