# Project Research Summary

**Project:** AgriRent
**Domain:** Two-sided farm equipment rental marketplace (owners list equipment, farmers book it)
**Researched:** 2026-06-26
**Confidence:** MEDIUM-HIGH

## Executive Summary

AgriRent is a two-sided rental/booking marketplace -- the same structural family as Airbnb, Turo, and B2B equipment-rental SaaS, but scoped to a single domain (farm equipment) and a single college-project deadline. Experts building this kind of product converge on the same non-negotiable trust mechanisms: server-enforced (ideally database-enforced) booking conflict prevention, server-computed pricing that never trusts client input, role-based access control backed by Row Level Security, and an approval-gated transaction loop before any money or messaging infrastructure is introduced. The pre-chosen stack (Next.js 15 App Router, Supabase, TailwindCSS + Shadcn, Vercel, NVIDIA NIM) holds up well against this pattern and requires no architectural changes -- only a handful of version pins and integration details (explicit Next 15 pin, react-leaflet SSR isolation, pooled Postgres connections).

The recommended approach is the one already encoded in PROJECT.md: build a thin, fully-wired walking skeleton (auth to listing to booking to AI) before deepening any single slice or polishing UI. Research strongly validates this sequencing -- it matches both the dependency graph of the features themselves (bookings require listings require auth; reviews require completed bookings; AI recommendations require booking history to look credible) and the "solve the core transaction loop before the money loop" pattern recommended across marketplace-MVP literature. Architecture research additionally confirms the project's instinct to centralize business logic in a service layer, use Server Actions for internal mutations and Route Handlers only for the AI endpoint, and keep the AI integration decoupled from core tables (FAQ-only, no DB writes) in v1.

The dominant risk across all four research files is the same risk stated from different angles: trust-boundary violations that are invisible in solo manual testing but break under concurrency or malicious input -- double-booking races, client-trusted prices, RLS recursion, and unbounded AI/connection usage under load. Every one of these has a well-documented, cheap-to-implement fix (Postgres EXCLUDE constraint, server-side price recompute, SECURITY DEFINER RLS helper functions, pooled connections, NIM retry/backoff) and every fix belongs in Phase 1, not as later hardening -- retrofitting any of them after the schema/RLS/booking logic is built out is significantly more expensive than building them in from the start.

## Key Findings

### Recommended Stack

The existing stack choice (Next.js 15 App Router + Supabase + TailwindCSS v4 + Shadcn UI + Vercel + Leaflet/OSM + NVIDIA NIM) is correct and should not be changed -- but four corrections matter: explicitly pin to Next.js 15 (npm's "latest" now resolves to 16), use the official openai npm client pointed at NVIDIA's baseURL rather than a dedicated SDK, isolate react-leaflet behind next/dynamic with ssr:false, and verify TypeScript 5.x (not the new 6.x major) against Next 15's peer-dependency range. The single highest-leverage stack decision is adding a Postgres EXCLUDE USING gist constraint (via btree_gist) as the authoritative double-booking guard -- application code alone cannot close this race condition.

**Core technologies:**
- Next.js 15 (App Router) -- full-stack framework; React 19 is a hard minimum dependency, pin explicitly
- Supabase (Postgres + Auth + Storage + RLS) -- single hosted backend covering DB, auth, file storage, and authorization
- TailwindCSS v4 + Shadcn UI -- current Shadcn CLI generates Tailwind v4/React 19-compatible code by default
- Leaflet + react-leaflet + OpenStreetMap -- free, no API key; requires next/dynamic SSR isolation
- openai npm client (v6.x) against NVIDIA NIM's OpenAI-compatible baseURL -- simplest dependency surface for a FAQ chatbot
- Zod + react-hook-form + hookform resolvers -- shared validation schemas between client forms and server actions
- Postgres btree_gist extension + EXCLUDE constraint -- the mechanism that actually guarantees no double-booking

### Expected Features

AgriRent's existing Active requirements already match the table-stakes feature set for this domain almost exactly -- research found no missing must-have feature. The differentiator worth keeping front-and-center is the AI FAQ chatbot, since most real Indian agri-rental competitors (Trringo, Khetigaadi, EM3) rely on call centers, not in-app AI.

**Must have (table stakes) -- all already in PROJECT.md Active scope:**
- Role-based auth (farmer/owner) with RLS-enforced boundaries
- Equipment listing CRUD with images and rates
- Search/filter by category, location, availability
- Server-enforced booking overlap rejection
- Server-computed total_amount
- Booking status state machine + owner approve/reject
- Owner & farmer dashboards
- Reviews gated to completed bookings only
- In-app notifications on status change
- Favorites

**Should have (competitive differentiators, sequence after v1 data exists):**
- AI FAQ chatbot (NVIDIA NIM)
- Verified/trusted owner badge (computed from completed bookings + ratings)
- AI-assisted equipment recommendations (needs real booking/review volume)
- Operator-included booking flag (operator_included schema field)

**Defer (v2+):**
- AI dynamic pricing suggestions for owners
- Geo-radius/map-based search
- Payment gateway/escrow (Razorpay)
- SMS notifications, full KYC verification, real-time chat, live GPS/IoT tracking, multi-language/voice interface

### Architecture Approach

The recommended architecture is a layered Next.js App Router monolith on top of Supabase: Server Components for reads, Server Actions for all internal mutations (grouped by domain in app/actions/), a single service layer (lib/services/) that owns business rules, Zod validation, and all Supabase calls, and exactly one Route Handler (/api/chat) for the AI integration since it needs streaming. RLS enforces the read-path boundary on every table; the rare service-role client is isolated to one file (lib/supabase/admin.ts) used only for system-generated cross-user writes.

**Major components:**
1. Auth/role boundary -- Supabase Auth + a server-controlled users.role column, middleware-enforced route groups
2. Listing service -- CRUD, image upload via Supabase Storage, validated client- and server-side
3. Booking service -- date-range request, Postgres EXCLUDE constraint as the conflict guard, server-computed price, status state machine
4. Notification layer -- synchronous DB insert on every status transition; client-side Supabase Realtime subscription
5. AI integration layer -- single Route Handler wrapping NVIDIA NIM, FAQ-only in v1, never given direct DB access

### Critical Pitfalls

1. RLS infinite recursion when a policy on one table queries another RLS-protected table (especially role checks) -- avoid via SECURITY DEFINER plpgsql helper functions or JWT custom claims, never direct cross-table subqueries in policies.
2. Application-only "check then insert" booking overlap logic -- classic TOCTOU race that worsens on serverless; the fix is a Postgres EXCLUDE USING gist constraint with a status filter.
3. Trusting any client-submitted price/total -- recompute total_amount server-side from the DB-stored rate on every write, and exclude the field from the accepted Zod input schema.
4. Vercel Hobby serverless assumptions -- direct (non-pooled) Postgres connections exhaust under concurrent traffic; async side-effects disappear after the response is sent; AI responses must stream rather than buffer.
5. NVIDIA NIM rate limits and model deprecation -- free tier RPM is low (around 40 RPM) and the originally-requested model is already confirmed dead (HTTP 410); wrap every NIM call in try/catch with bounded retry/backoff, debounce the client, treat model name as configuration.

## Implications for Roadmap

Based on research, the project's own intended phase structure (walking skeleton first, deepen per slice, design phase last) is validated by all four research files and should be the basis for the roadmap, with pitfall-prevention work pulled into Phase 1 rather than deferred.

### Phase 1: Walking Skeleton (Auth to Listing to Booking to AI)
**Rationale:** Every later feature depends on this thin vertical slice existing and being correct; this is also where every critical trust-boundary fix (RLS pattern, exclusion constraint, server-side pricing, pooled connections, NIM error handling) must be built in, since retrofitting any of them later is far more expensive.
**Delivers:** A single farmer and owner account can sign up with roles, list one piece of equipment, request/approve one booking with a correct server-computed price and zero double-booking possibility, see one notification, and get one working chatbot answer.
**Addresses:** Role-based auth, equipment CRUD (minimal), booking request + approve/reject, server-computed pricing, AI FAQ chatbot (thin), RLS skeleton.
**Avoids:** RLS infinite recursion, double-booking race condition, client-trusted pricing, Vercel connection exhaustion, NIM rate-limit crashes.

### Phase 2: Booking Lifecycle + Search/Filter Deepening
**Rationale:** Reviews and richer dashboards both depend on bookings reaching completed, and search/filter deepens the listing service Phase 1 left intentionally flat -- both higher core-value than dashboard polish.
**Delivers:** Full booking state machine (completed/cancelled transitions), category/location/availability filtering on the browse page.
**Uses:** Postgres indexes on category/location/availability columns; date-fns + Shadcn date-range picker for UI.
**Implements:** Listing service and booking service deepening from the architecture diagram -- no structural changes.

### Phase 3: Reviews + Trust Signals
**Rationale:** Reviews are now unlockable because completed bookings exist; the verified-owner badge is a pure read-model on top of reviews + bookings data.
**Delivers:** Review CRUD gated to completed bookings (enforced at both Zod/service and RLS level), verified/trusted owner badge.
**Addresses:** Reviews and verified-owner-badge features.

### Phase 4: Dashboard Richness + Notification Deepening
**Rationale:** Dashboards and live notifications depend on bookings/reviews/notifications existing in at least minimal form, which they now do.
**Delivers:** Stats/history-rich owner and farmer dashboards; notifications move from "list on a page" to client-side Supabase Realtime subscription with a bell icon.
**Implements:** Notification layer deepening -- purely additive to existing notification-row-writing logic.

### Phase 5: AI Layer Deepening (Recommendations, Tool-Calling)
**Rationale:** AI recommendations need real booking/review volume to be credible and are the least core-value-critical slice -- they also require the listing/booking services to be stable enough to safely expose as tools.
**Delivers:** AI-assisted equipment recommendations, optionally tool-calling into existing listing/booking services.
**Addresses:** AI recommendations differentiator, with operator-included flag and rebook-shortcut as cheap adjacent additions if time allows.

### Phase 6: UI/Design Polish
**Rationale:** Per PROJECT.md's explicit decision, visual work is deferred until every functional slice runs end-to-end, so design work is never thrown away by functional changes underneath it.
**Delivers:** Presentable, portfolio-ready UI across all flows built in Phases 1-5.

### Phase Ordering Rationale

- Dependencies are strictly forward-only: auth to listing to booking to notification/AI in Phase 1, then reviews depend on booking-completion (Phase 2 before Phase 3), then dashboards/realtime depend on all of the above existing (Phase 4), then AI recommendations depend on real data volume (Phase 5 last among functional work).
- Every critical pitfall is addressed in Phase 1 specifically because all five research files agree these are foundational/non-negotiable, affecting the project's literal core value proposition.
- UI polish is sequenced last per the project's own explicit constraint and validated by architecture research's observation that functional changes would otherwise invalidate visual work done earlier.

### Research Flags

Needs research during planning:
- Phase 1: AI chatbot slice (NVIDIA NIM streaming + rate-limit handling) -- model availability has already changed once mid-research; verify current model availability and rate-limit behavior again at implementation time.
- Phase 1: RLS policy design for the users/equipments/bookings chain -- the recursion failure mode is well documented but easy to reintroduce when adding later tables (favorites, reviews, notifications).
- Phase 5: AI tool-calling into listing/booking services -- no single canonical "marketplace + AI" reference architecture exists; validate the chosen approach against the AI SDK's current tool-calling docs before implementing.

Phases with standard patterns (skip research-phase):
- Phase 2: Search/filter and booking-lifecycle deepening -- well-documented Postgres indexing and state-machine patterns.
- Phase 3: Reviews -- straightforward CRUD + RLS condition, pattern fully specified in architecture research.
- Phase 4: Dashboard richness and Realtime notifications -- Supabase's official Realtime pattern is HIGH confidence and directly applicable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Verified against live npm registry version data, but library-specific API details and some compatibility claims (e.g., TypeScript 6.x with Next 15) are web-search-synthesized, not Context7/official-doc-verified |
| Features | MEDIUM | Synthesized from vendor blogs, marketplace-builder content, and industry roundups rather than primary platform docs or user interviews; cross-source convergence raises confidence on cross-checked claims specifically |
| Architecture | HIGH | Component structure, RLS patterns, booking-conflict pattern, and Server Actions vs Route Handlers are all corroborated by official Supabase/Vercel docs; notification-layer specifics and AI tool-calling depth are MEDIUM |
| Pitfalls | HIGH | RLS recursion, Postgres exclusion constraints, Vercel function limits, and price-tampering patterns are well documented with official docs and convergent community sources; NVIDIA NIM rate-limit specifics are MEDIUM |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- TypeScript 5.x vs 6.x compatibility with Next.js 15: not verified directly against Next.js 15's own package.json peer-dependency range -- confirm before scaffolding and default to ^5.7.0 unless explicitly verified otherwise.
- NVIDIA NIM model stability: the originally requested model is already confirmed dead mid-research; treat the current model as subject to change and keep it as a single configuration value -- re-verify availability at Phase 1 implementation time.
- AI tool-calling architecture for Phase 5 recommendations: no canonical reference pattern exists for "marketplace + AI"; resolve via a research-phase pass when Phase 5 planning begins.
- Geo-radius search implementation approach (PostGIS vs haversine): correctly deferred past v1, but the specific implementation choice was not researched in depth -- address when this feature is actually scheduled.

## Sources

### Primary (HIGH confidence)
- Next.js 15 upgrade guide (nextjs.org/docs/app/guides/upgrading/version-15) -- React 19 minimum, async request APIs
- Supabase official blog -- Range Columns (supabase.com/blog/range-columns) -- EXCLUDE/daterange booking-conflict pattern
- Row Level Security | Supabase Docs (supabase.com/docs/guides/database/postgres/row-level-security)
- Vercel Functions Limits (vercel.com/docs/functions/limitations)
- Publish and Subscribe to Realtime Data on Vercel (vercel.com/kb/guide/publish-and-subscribe-to-realtime-data-on-vercel)
- Getting Started: Next.js App Router -- AI SDK official docs (ai-sdk.dev/docs/getting-started/nextjs-app-router)
- npm registry direct queries (live version/dist-tag data for next, react, zod, leaflet, react-leaflet, openai, supabase-js, supabase/ssr, tailwindcss, typescript, react-hook-form, hookform resolvers)

### Secondary (MEDIUM confidence)
- Supabase RLS Best Practices -- makerkit.dev -- role-table pattern over user_metadata
- PostgreSQL's GiST Exclusion Constraint -- amitavroy.com
- Server Actions vs Route Handlers -- Makerkit
- Sharetribe marketplace-building guides -- feature landscape for heavy-equipment/P2P rental marketplaces
- NVIDIA NIM rate limit forum threads -- around 40 RPM free tier, credit exhaustion behavior
- Price Manipulation in E-commerce Applications -- Sourcery -- client-side price tampering pattern

### Tertiary (LOW confidence)
- Indian agri-rental competitor analysis (Trringo, Khetigaadi, EM3) -- competitor feature patterns, directional only
- AI dynamic pricing ROI claims -- BlackBall Logistics, InTempo Software -- vendor-marketing-sourced
- Various single-author Medium/DEV Community posts corroborating RLS recursion and service-role isolation patterns

---
*Research completed: 2026-06-26*
*Ready for roadmap: yes*
