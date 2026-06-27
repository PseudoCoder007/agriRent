# Phase 1 Walking Skeleton: AgriRent

**Mode:** mvp
**Defined:** 2026-06-26

## What "Walking Skeleton" Means Here

Phase 1 is a single thin vertical slice that runs end-to-end through every architectural layer — auth, equipment, booking, notification, AI — before any layer is deepened or polished. Every later phase deepens one of these slices; none of them add a *new* layer. This file exists so planning and execution never accidentally widen Phase 1 into a horizontal "do auth properly, then do equipment properly" structure.

## The Slice (must all be true together, on one deploy)

A single farmer account and a single owner account can, in this order:

1. **Sign up and log in** with a role chosen at signup (farmer or owner); session persists across refresh; either can log out from any page.
2. **Owner creates one equipment listing** (title, description, category, hourly/daily rate, at least one photo uploaded to Supabase Storage with size/type validation).
3. **Farmer browses the flat listing** (no filters yet) and **opens the equipment detail page** (photos, rate, owner, description).
4. **Farmer requests a booking** for a date range. Server (not client) computes `total_amount` from the equipment's stored rate. A second, overlapping booking request for the same equipment is rejected by a Postgres `EXCLUDE USING gist` constraint (via `btree_gist`), not just application logic.
5. **Owner approves or rejects** the pending request from a bare-minimum dashboard view (equipment list + incoming requests + active bookings — no stats, no polish). Status transitions are server-enforced (pending → approved/rejected only in Phase 1; completed/cancelled are deferred to Phase 2).
6. **Farmer sees the booking status** on a bare-minimum dashboard (their bookings + current status).
7. **A notification row is written** on booking create/approve/reject and is visible as a plain list on a dashboard page — no Supabase Realtime, no bell icon yet.
8. **Either user asks the AI chatbot** an FAQ-style rental question (how to book, deposit policy, etc.) via `/api/chat` wired to NVIDIA NIM (`meta/llama-3.1-8b-instruct`, OpenAI-compatible client) and gets back a real model response. The chatbot never writes to `bookings` or `equipments` — FAQ-only, no tool-calling, no DB access.

## Required Build Order (hard dependency chain — do not reorder)

1. **DB schema + RLS skeleton.** Create `users`, `equipments`, `equipment_images`, `bookings`, `notifications` (reviews/payments/favorites tables may exist in schema but need no working flow yet). Enable RLS on every table in the same migration it's created in. Role/ownership checks go through a `SECURITY DEFINER LANGUAGE plpgsql` helper function (e.g. `is_owner()`) or JWT custom claims — never a direct subquery into another RLS-protected table, to avoid infinite recursion. Wrap `auth.uid()` calls as `(select auth.uid())` in every policy. Enable `btree_gist` and add the booking `EXCLUDE USING gist (equipment_id WITH =, daterange(start_date, end_date, '[]') WITH &&) WHERE (status IN ('pending','approved'))` constraint up front — this is schema, not an afterthought.
2. **Auth + role boundary.** Supabase Auth signup/login, role stored in the server-controlled `users` table (never `user_metadata`), middleware-enforced role-scoped route groups (`(farmer)` / `(owner)`).
3. **Listing service (minimal).** Owner create + flat farmer browse + detail view. No edit/delete, no filters, no favorites — those are Phase 2 deepening.
4. **Booking service (minimal).** Create with server-computed price, EXCLUDE-constraint conflict guard (catch Postgres `23P01` and translate to a friendly message, never a raw 500), owner approve/reject. Status machine stops at pending/approved/rejected in Phase 1.
5. **Notification (minimal).** Synchronous row insert on every status transition in the same request; plain list display.
6. **AI integration (minimal).** One `/api/chat` Route Handler, server-side-only API key, try/catch with bounded retry/backoff on 429/5xx, friendly fallback message, streamed response, bounded conversation history sent per call.

## Infrastructure Guards (non-negotiable, built in from the start, not retrofitted)

- **Pooled Postgres connection string** (Supavisor transaction mode, port 6543) used in every DB-touching code path from the very first one — never the direct 5432 connection string.
- **No client-trusted price or status.** Booking creation Zod schema does not even accept `total_amount` or `status` as input fields.
- **No "fire and forget" async side effects.** Notification writes are awaited before the response is returned — Vercel Hobby gives no guaranteed post-response execution.
- **Storage bucket-level validation** (`allowed_mime_types`, size limit) on the equipment-images bucket — never client-form validation alone.

## Explicitly Deferred Out of Phase 1 (do not pull forward)

- Equipment edit/delete (EQUIP-02, EQUIP-03)
- Category/location filtering (EQUIP-05)
- Favorites (EQUIP-07)
- Booking `completed`/`cancelled` transitions (part of BOOK-05's full state machine)
- Reviews (REVIEW-01, REVIEW-02) — hard-blocked on `completed` bookings existing, which Phase 1 does not produce
- Realtime notifications / bell icon
- AI tool-calling, recommendations, dynamic pricing
- All UI/visual polish

## Definition of Done for Phase 1

All 8 numbered slice steps above work, in sequence, on the deployed Vercel app, for one farmer account and one owner account — and every item in "Infrastructure Guards" is independently verifiable (see PITFALLS.md's "Looks Done But Isn't" checklist for verification methods: concurrent double-booking test, tampered-price test, pooled-connection-string check, RLS-enabled-on-every-table check, 429-simulation test).

---
*Source: research/ARCHITECTURE.md "Build Order: Walking Skeleton First" + research/PITFALLS.md Phase 1 mappings*
