# AgriRent

## What This Is

AgriRent is a web-based farm equipment rental marketplace connecting equipment owners (who list tractors/machinery) with farmers who need to rent it. Owners manage listings and approve/reject booking requests; farmers search, filter, and book equipment for a date range. Built as a final-year college project and portfolio piece on Next.js 15 + Supabase, deployed on Vercel.

## Core Value

A farmer can find available equipment near them and successfully book it for a date range, and the owner can approve or reject that request — end to end, with no double-booking and no client-side price tampering.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Role-based authentication (farmer / owner) via Supabase Auth, with role assigned at signup
- [ ] Owner can add, edit, and delete equipment listings with images and hourly/daily rates
- [ ] Farmer can browse and filter equipment (category, location, availability)
- [ ] Farmer can request a booking for a date range
- [ ] Booking creation rejects overlapping date ranges for the same equipment (no double-booking)
- [ ] Booking total_amount is computed server-side from the equipment's stored rates — never trusted from client input
- [ ] Booking has an explicit, server-enforced status state machine: pending → approved/rejected → completed/cancelled
- [ ] Owner can approve or reject pending booking requests
- [ ] Owner dashboard: equipment list, active bookings, incoming requests
- [ ] Farmer dashboard: my bookings, booking status tracking
- [ ] Reviews can only be created against completed bookings
- [ ] In-app notifications fire on booking status changes (created/approved/rejected/completed)
- [ ] Basic AI chatbot answering rental FAQs, powered by NVIDIA NIM API — proves the AI layer end-to-end in Phase 1
- [ ] Row Level Security enforces ownership boundaries on every table (equipment, bookings, reviews, notifications, favorites)
- [ ] Equipment images upload to Supabase Storage with file size/type validation

### Out of Scope

- Live GPS tracking — adds infra complexity not needed to prove core rental value
- Real-time chat — in-app notifications are sufficient for v1
- Payment gateway (Razorpay) — booking approval ships first; payments are a separate compliance/trust surface, deferred to v2
- SMS notifications — in-app notifications suffice for v1
- Government subsidy integration — not core to the rental marketplace
- Machine IoT tracking — future commercial feature, not needed for MVP

## Context

- Final-year college project, also intended as a portfolio/demo piece — should be presentable, not just functional.
- Full DB schema already drafted: `users`, `equipments`, `bookings`, `payments`, `reviews`, `notifications`, `favorites`, `equipment_images`.
- Tech stack and 8-hour build plan were worked out in prior conversation; this document formalizes and refines that into an actual roadmap.
- **AI provider:** NVIDIA NIM API (OpenAI-compatible client), model `meta/llama-3.1-8b-instruct`. The originally requested `minimaxai/minimax-m2.5` is end-of-life on NVIDIA's API as of 2026-05-12 (confirmed via live test — returns HTTP 410). The API key is valid and stored in `.env.local` (gitignored) — **never** referenced by value in any planning doc or committed file.
- **Project structure:** Vertical MVP. Phase 1 is a thin, fully-wired "walking skeleton" — auth → equipment → booking → AI — that actually runs end-to-end, rather than a horizontal auth-only layer. Later phases deepen each slice (full search/maps, richer AI features, fuller dashboards, reviews/notifications polish). A dedicated UI design phase comes after core functionality runs, so visual polish doesn't block functional progress.

## Constraints

- **Tech stack**: Next.js 15 App Router, TypeScript only (no `.js` files), TailwindCSS + Shadcn UI, Supabase (Postgres + Auth + Storage + RLS), Vercel deployment — why: agreed stack for a full-stack app deployable entirely on Vercel's free Hobby plan.
- **Deployment limits**: Vercel Hobby plan has serverless function execution-time limits; no long-running background jobs or persistent WebSockets — why: free-tier constraint, ruled out real-time chat/live tracking for this reason too.
- **Code quality**: max 500 lines/file, ~80 lines/component, Server Components first, Zod for all validation, no raw SQL inside components (service layer only), API responses always shaped `{success, message, data}` — why: agreed conventions from prior discussion, keep enforced via CLAUDE.md.
- **Booking integrity**: date-range conflicts and total price must be validated/computed server-side, never trusted from client — why: prevents double-booking and price tampering, a real-world trust requirement for a rental marketplace.
- **Secrets**: `NVIDIA_API_KEY` lives only in `.env.local` (gitignored) — why: key was shared in plain chat text; must never be committed or echoed into planning docs.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vertical MVP mode, Phase 1 = walking skeleton (auth + equipment + booking + AI, thin but running end-to-end) | User explicitly wants a basic but fully running app — including AI — before deepening any one slice or polishing UI | — Pending |
| AI provider: NVIDIA NIM, `meta/llama-3.1-8b-instruct` | User's key is valid on NVIDIA's API; originally requested model is EOL; this model was confirmed working live | — Pending |
| Booking `total_amount` computed server-side from equipment rates | Prevents price tampering via client-submitted amounts | — Pending |
| Dedicated UI phase deferred until core functionality runs | User explicitly wants function-first, then design-polish | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-26 after initialization*
