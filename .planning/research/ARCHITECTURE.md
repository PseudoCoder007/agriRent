# Architecture Research

**Domain:** Two-sided rental/booking marketplace (farm equipment rental)
**Researched:** 2026-06-26
**Confidence:** HIGH (component structure, RLS patterns, booking-conflict pattern, Server Actions vs Route Handlers — all corroborated by official Supabase/Vercel docs and multiple independent production write-ups) / MEDIUM (notification layer specifics, AI chatbot tool-calling depth — pattern is consistent across sources but no single canonical "marketplace + AI" reference architecture exists)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
├───────────────────────────────────────────────────────────────────--┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Auth Forms│  │ Listing   │  │ Booking   │  │ AI Chat Widget   │  │
│  │ (login/   │  │ Browse +  │  │ Request + │  │ (useChat /       │  │
│  │  signup)  │  │ Detail UI │  │ Dashboard │  │  custom hook)    │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│        │              │              │                 │            │
│        │   Supabase Realtime client-side subscription   │            │
│        │              │   (notifications bell, no SSR)  │            │
├────────┴──────────────┴──────────────┴─────────────────┴────────────┤
│                  NEXT.JS 15 APP ROUTER (Vercel, serverless)         │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
│  │ Server Components│  │  Server Actions   │  │  Route Handlers  │  │
│  │ (data reads:      │  │ (mutations:       │  │ (/api/chat,      │  │
│  │  listings, bookings)│ create/approve/    │  │  /api/webhooks,  │  │
│  │                   │  │  reject booking)   │  │  external-only)  │  │
│  └─────────┬─────────┘  └─────────┬────────┘   └────────┬─────────┘  │
│            │                       │                     │           │
│            └───────────┬───────────┴─────────┬───────────┘           │
│                         ▼                     ▼                      │
│              ┌─────────────────────┐  ┌─────────────────┐            │
│              │   Service Layer      │  │  AI Integration  │            │
│              │ (auth, listing,      │  │  Layer           │            │
│              │  booking, review,    │  │ (NVIDIA NIM      │            │
│              │  notification)       │  │  OpenAI-compat   │            │
│              │  + Zod validation    │  │  client)         │            │
│              └──────────┬──────────┘  └────────┬─────────┘            │
├─────────────────────────┴──────────────────────┴──────────────────────┤
│                    SUPABASE (Postgres + Auth + Storage)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ auth.users│ │equipments│ │ bookings │ │  reviews │ │notifications│  │
│  │ + users   │ │ +images  │ │ (EXCLUDE │ │          │ │             │  │
│  │ (role)    │ │          │ │ constraint)│          │ │             │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │
│         RLS policies on every table (ownership + role boundary)        │
│         Storage buckets: equipment-images (RLS-scoped)                 │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼ (HTTPS, server-side only, key never exposed)
              ┌─────────────────────────┐
              │   NVIDIA NIM API         │
              │ (OpenAI-compatible,      │
              │  meta/llama-3.1-8b-      │
              │  instruct)               │
              └─────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Auth / role boundary | Identity, session, role assignment (farmer/owner), route protection | Supabase Auth (`@supabase/ssr`), a `users` table row keyed to `auth.users.id` storing `role`, middleware that redirects by role, RLS policies that branch on `role` |
| Listing service | CRUD for equipment, image upload, availability metadata | Server Components for reads (direct Supabase query), Server Actions for owner mutations, Supabase Storage for images, Zod schema for create/edit payloads |
| Booking service | Date-range request, conflict detection, status state machine, server-computed price | Server Action `createBooking()` → Postgres `EXCLUDE USING gist` constraint as the authoritative conflict guard, price computed from `equipments.rate` server-side, status transitions gated by role + current status in a single service function, never by client-supplied status |
| Notification layer | Fire on booking status change, deliver in-app | DB trigger or same-transaction insert into `notifications` table as the source of truth; client-side Supabase Realtime subscription (browser, not serverless function) for live bell updates; polling/`Server Component` re-fetch on dashboard load is an acceptable v1 fallback |
| AI integration layer | Chatbot answering rental FAQs | Single Route Handler (`/api/chat`) holding the NVIDIA NIM API key server-side, OpenAI-compatible client call, optionally streamed to client; no tool-calling/DB access needed for v1 FAQ bot |
| Service layer (cross-cutting) | Single place where business rules + Zod validation + Supabase calls live; no raw SQL in components | `lib/services/{auth,listing,booking,review,notification}.ts`, each function returns `{success, message, data}` |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                    # signup, login — route group, no shared chrome
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (farmer)/                  # role-scoped route group
│   │   ├── browse/page.tsx        # equipment listing + filters (Server Component)
│   │   ├── equipment/[id]/page.tsx
│   │   ├── bookings/page.tsx      # farmer dashboard: my bookings
│   │   └── layout.tsx             # enforces role=farmer via middleware/guard
│   ├── (owner)/
│   │   ├── dashboard/page.tsx     # equipment list, active bookings, requests
│   │   ├── equipment/new/page.tsx
│   │   └── layout.tsx             # enforces role=owner
│   ├── api/
│   │   ├── chat/route.ts          # AI chatbot — external/streaming, Route Handler
│   │   └── webhooks/...           # future: payment webhooks (out of scope v1)
│   ├── actions/                   # Server Actions, grouped by domain
│   │   ├── booking.actions.ts     # createBooking, approveBooking, rejectBooking
│   │   ├── listing.actions.ts     # createEquipment, updateEquipment, deleteEquipment
│   │   └── review.actions.ts
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # browser client (RLS-scoped, anon key)
│   │   ├── server.ts               # server client (RLS-scoped, cookies-based)
│   │   └── admin.ts                # service-role client — used ONLY inside service layer for trusted writes that must bypass RLS (e.g. system-generated notifications)
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── listing.service.ts
│   │   ├── booking.service.ts      # owns conflict detection + price calc + status machine
│   │   ├── review.service.ts
│   │   ├── notification.service.ts
│   │   └── ai.service.ts           # wraps NVIDIA NIM OpenAI-compatible client
│   ├── validations/                # Zod schemas, one per domain entity
│   │   ├── equipment.schema.ts
│   │   ├── booking.schema.ts
│   │   └── review.schema.ts
│   └── types/                      # shared TS types, ideally derived via z.infer
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── equipment/
│   ├── booking/
│   └── chat/                       # AI chat widget
└── middleware.ts                   # session refresh + role-based redirects
```

### Structure Rationale

- **Route groups `(farmer)`/`(owner)`:** Next.js App Router route groups let role-specific dashboards share layouts and guards without polluting the URL, and make the role boundary visually obvious in the file tree — directly supports the "auth/role boundary" component being a first-class structural decision, not just a middleware check.
- **`app/actions/` instead of inline actions:** Keeps Server Actions colocated by domain rather than scattered per-page, matching the project's own 500-line-file constraint and making it trivial to find "everything that mutates a booking."
- **`lib/services/`:** This is the single layer that talks to Supabase for business logic — components and Server Actions call services, never the Supabase client directly for anything beyond a simple Server-Component read. This is what the project's "no raw SQL inside components" constraint actually resolves to in file terms.
- **`lib/supabase/admin.ts` kept separate and rare:** Service-role key bypasses RLS; isolating it to one file makes every privileged write auditable. Used sparingly (e.g., system-inserted notifications), not as a general escape hatch from RLS.
- **`lib/validations/`:** Centralizing Zod schemas lets both Server Actions and the future API routes import the same schema, and lets you derive TypeScript types with `z.infer` instead of hand-duplicating types — directly satisfies the project's "Zod for all validation" constraint.

## Architectural Patterns

### Pattern 1: Server Actions for mutations, Route Handlers only for external/streaming callers

**What:** Every mutation triggered from AgriRent's own UI (create booking, approve/reject, create listing, post review) is a Server Action. The only Route Handler in Phase 1 is `/api/chat`, because the AI SDK's streaming response pattern and potential future external callers (mobile app, webhook) need a real HTTP endpoint.
**When to use:** Default to Server Actions; reach for a Route Handler only when (a) you need streaming, (b) a non-browser caller needs it, or (c) you need a GET-able cached endpoint.
**Trade-offs:** Server Actions are POST-only and harder to unit-test in isolation, but eliminate request/response boilerplate and integrate with `revalidatePath`. Route Handlers are easier to test and required for streaming AI responses.

**Example:**
```typescript
// app/actions/booking.actions.ts
'use server'
export async function createBooking(input: CreateBookingInput) {
  const parsed = createBookingSchema.parse(input) // Zod, throws on invalid
  const result = await bookingService.create(parsed) // service layer owns conflict + price logic
  if (result.success) revalidatePath('/bookings')
  return result // {success, message, data}
}
```

### Pattern 2: Database-level conflict detection via EXCLUDE constraint, not application-level overlap checks

**What:** A Postgres `EXCLUDE USING gist` constraint on `(equipment_id WITH =, daterange(start_date, end_date) WITH &&)` rejects an overlapping booking insert atomically, at the database layer — closing the race-condition window that an application-level "check then insert" pattern cannot close under concurrent requests.
**When to use:** Any booking/reservation system where two requests could plausibly race for the same resource and date range — which is the explicit "no double-booking" requirement here.
**Trade-offs:** Requires the `btree_gist` extension (trivial to enable in Supabase) and a `daterange` column expression instead of two raw date columns; the payoff is correctness guaranteed by the database itself, independent of application bugs, retries, or multiple serverless instances writing concurrently.

**Example:**
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
  WHERE (status NOT IN ('rejected', 'cancelled'));
```
The service layer still does a friendly pre-check query for UX (show "unavailable" before submit), but the constraint — not the pre-check — is the actual source of truth that prevents double-booking. The application MUST catch the resulting Postgres error (constraint violation) and translate it into the `{success: false, message: "..."}` shape rather than letting it surface as a raw 500.

### Pattern 3: RLS for read-path isolation, service-layer + service-role for trusted writes

**What:** Row Level Security policies are the enforced boundary for SELECT queries (a farmer can only read their own bookings; an owner can only read bookings on their own equipment). For INSERT/UPDATE paths that involve cross-entity side effects (e.g., approving a booking also needs to write a notification row for a *different* user than the actor), route the write through the service layer using the server-side Supabase client (still RLS-respecting for the actor's own writes) and reserve the service-role client only for the narrow case of system-generated rows that no end-user actor "owns" (e.g., the notification insert itself).
**When to use:** This project, specifically — because notifications are written on behalf of "the other party" in a transaction, which plain per-user RLS would otherwise block.
**Trade-offs:** Slightly more nuance than "RLS does everything," but keeps the project's explicit requirement ("RLS enforces ownership boundaries on every table") true for reads and for self-owned writes, while still allowing the one legitimate cross-user write (status-change notifications) to function without weakening RLS policies themselves.

## Data Flow

### Request Flow — Booking Creation (the core walking-skeleton path)

```
Farmer clicks "Request Booking" (date range selected)
    ↓
Server Action: createBooking(equipmentId, startDate, endDate)
    ↓
Zod validates input shape (dates, equipmentId format)
    ↓
booking.service.ts:
  1. Fetch equipment.rate (server-side, never trust client price)
  2. Compute total_amount = rate * duration
  3. INSERT INTO bookings (status='pending', total_amount=computed)
       → Postgres EXCLUDE constraint either allows or rejects
    ↓
On success: notification.service.ts inserts a notification row for the owner
    ↓
revalidatePath('/owner/dashboard') + revalidatePath('/farmer/bookings')
    ↓
Response { success, message, data: booking } returned to UI
    ↓
Owner's dashboard (next load, or live via Realtime subscription) shows new pending request
    ↓
Owner clicks Approve/Reject → Server Action: updateBookingStatus()
    ↓
booking.service.ts: validates current status is 'pending' before transition (state machine guard)
    ↓
notification.service.ts inserts status-change notification for farmer
```

### AI Chatbot Flow

```
User types question in chat widget (client component)
    ↓
POST /api/chat (Route Handler) — message + (optional) short history
    ↓
ai.service.ts: builds OpenAI-compatible request to NVIDIA NIM
    (API key read from process.env, server-side only)
    ↓
NVIDIA NIM API (meta/llama-3.1-8b-instruct) — streamed or single response
    ↓
Route Handler streams/returns response → chat widget renders
```

### Key Data Flows

1. **Listing → Booking:** Equipment rate and availability are read-only inputs into booking creation; the booking service never accepts owner-set price overrides from the client, only re-reads the canonical `equipments.rate` at booking time.
2. **Booking → Notification:** Every status transition (pending→approved/rejected, approved→completed/cancelled) is the single point where a notification row is written; this keeps "what triggers a notification" centralized in one service function rather than scattered across UI code.
3. **Booking → Review:** Reviews are only insertable when the referenced booking's status is `completed` — enforced both by a Zod/service-layer check and ideally an RLS policy condition referencing the booking's status, so a forged client request can't bypass it.
4. **AI layer isolation:** The AI integration layer never writes to the marketplace's core tables in Phase 1 (FAQ-only, no booking-via-chat). This keeps the AI surface decoupled — it can be deepened later (e.g., "find me a tractor near X" tool-calling into the listing service) without the core booking/listing logic depending on the AI layer at all.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users (college project / early demo) | Current monolithic Next.js + Supabase setup is correct and sufficient. No caching layer, no queue, no edge functions needed. |
| 1k-100k users | Add caching for equipment browse/search (Next.js `revalidate`/ISR on listing pages), move notification fan-out off the request path if volume grows (Postgres trigger + Edge Function instead of inline service-layer insert), consider read replicas only if Supabase metrics show read contention. |
| 100k+ users | Out of scope for this project's stated context (final-year/portfolio), but the natural next steps would be: dedicated search service (Postgres full-text or external search like Algolia/Meilisearch), background job runner for notification/email fan-out (Supabase Edge Functions or a separate worker, since Vercel Hobby/Pro still caps execution time), and splitting the AI layer into its own service if tool-calling/agentic features grow. |

### Scaling Priorities

1. **First bottleneck:** Equipment browse/search performance once listings grow past a few hundred rows with filters — fix with proper Postgres indexes on `category`, `location`, and availability-relevant columns before reaching for anything fancier.
2. **Second bottleneck:** Notification write volume if it stays synchronous inside the booking Server Action — fix by moving the insert to a lightweight async path (Postgres trigger) so the booking mutation's response time doesn't depend on notification-writing latency.

## Anti-Patterns

### Anti-Pattern 1: Trusting client-submitted price or status in any booking mutation

**What people do:** Pass `total_amount` or `status` directly from a client-side form/fetch body into an INSERT/UPDATE.
**Why it's wrong:** Trivially tampered via browser devtools or a direct API call; this is exactly the trust boundary the project's own constraints call out explicitly.
**Do this instead:** Server Action/service layer recomputes `total_amount` from the equipment's stored rate every time, and status transitions are only ever set by server-side logic that checks the *current* status before allowing a transition — never accepts an arbitrary target status from the client.

### Anti-Pattern 2: Building the booking-conflict check only in application code (read-then-write)

**What people do:** Query existing bookings for overlap, and if none found, insert — all in two separate steps in JS/TS.
**Why it's wrong:** Two concurrent requests can both pass the "no overlap" check before either insert commits, producing a double-booking race condition — especially likely on serverless platforms where multiple function instances can run truly concurrently.
**Do this instead:** Enforce the no-overlap rule with a Postgres `EXCLUDE USING gist` constraint (Pattern 2 above) as the authoritative guard; keep the application-level check only for fast UX feedback before submission.

### Anti-Pattern 3: Trying to run Supabase Realtime subscriptions or long-lived connections inside a Next.js serverless function

**What people do:** Attempt to subscribe to Postgres changes or hold a WebSocket open inside a Route Handler or Server Action to "push" notifications server-side.
**Why it's wrong:** Vercel serverless functions (including Hobby plan) have hard execution-time caps and are not designed to hold persistent connections; this is also explicitly called out as out-of-scope infra in this project's constraints (no persistent WebSockets).
**Do this instead:** Subscribe to Supabase Realtime from the browser (client component) — the long-lived WebSocket lives in the user's browser tab, not in a Vercel function — or fall back to simple re-fetch-on-navigation/polling for the in-app notification bell in Phase 1, upgrading to client-side Realtime once the walking skeleton works.

### Anti-Pattern 4: Letting the AI integration layer become a backdoor around RLS or validation

**What people do:** Give the chatbot direct database access or a service-role client "to be helpful," letting it answer questions by querying tables directly.
**Why it's wrong:** Bypasses the same validation/RLS boundaries enforced everywhere else, and turns the AI layer into an unaudited write/read path with model-generated queries.
**Do this instead:** Phase 1 chatbot is FAQ-only (no DB access at all) — pure prompt-in/completion-out via the AI service. If later phases add "ask the AI to find equipment," the AI layer should call the *same* listing service functions (with their existing validation) via explicit tool-calling, never raw SQL or direct table access.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` server + browser clients, middleware refreshes session cookies | Role (`farmer`/`owner`) stored in a `users` table row, not in Auth metadata alone, so RLS policies can join against it cleanly |
| Supabase Postgres | Server Components read directly via server client for simple fetches; all mutations go through service layer | RLS enabled on every table from the start, per project constraint |
| Supabase Storage | Equipment images uploaded via Server Action, validated (size/type) with Zod before upload call | Storage bucket RLS policy should mirror equipment ownership rules |
| NVIDIA NIM API | OpenAI-compatible client, server-side only, called from one Route Handler | Key in `.env.local` only; never logged, never sent client-side, never referenced by value in planning docs (per project constraint) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI components ↔ Server Actions | Direct function import + call (Next.js RPC-like mechanism) | No manual fetch/JSON boilerplate; this is the primary "wire" for the walking skeleton |
| Server Actions ↔ Service layer | Direct function call within the same server runtime | Service layer is where Zod validation + business rules + Supabase calls happen; Actions stay thin (parse input, call service, revalidate) |
| Service layer ↔ Supabase | Supabase JS client (server-scoped, RLS-respecting by default; service-role client only for the narrow notification-on-behalf-of-other-user case) | Single point of DB access; nothing else in the app touches Supabase directly except simple Server-Component reads |
| Booking service ↔ Notification service | Direct in-process call after a successful status-changing operation, same transaction/request lifecycle | Keeps "what triggers a notification" in one obvious place; can later move to a DB trigger without changing the caller's contract |
| Chat widget ↔ AI Route Handler | HTTP POST (streamed or JSON), client component only | Fully decoupled from booking/listing services in Phase 1 — this isolation is what makes it safe to "prove the AI layer end-to-end" without it threatening core marketplace correctness |

## Build Order: Walking Skeleton First, Deepen Per Slice

This project's explicit mandate is a *thin, fully-wired vertical slice* before any horizontal deepening or UI polish. The architecture above is built to make that possible: every component boundary listed is intentionally the **minimum viable version** of that component, with an obvious, named axis to deepen later without restructuring.

### Phase 1 — Walking Skeleton (minimal path through every layer)

Build in this order, because each step is a hard dependency for the next:

1. **DB schema + RLS skeleton** — Create `users`, `equipments`, `equipment_images`, `bookings`, `notifications` tables (reviews/payments/favorites tables can exist in schema but don't need working flows yet) with the booking `EXCLUDE` constraint and baseline RLS policies (own-row read/write). This is the foundation everything else writes through — must exist before any service layer code is meaningful.
2. **Auth + role boundary** — Supabase Auth signup/login, role assigned at signup, middleware route protection, role-scoped route groups. Nothing else can be meaningfully tested without an identity and a role, since every later policy and UI branch depends on "who is this and what role are they."
3. **Listing service (minimal)** — Owner can create one equipment listing (name, rate, one image, category). Farmer can view a flat list (no filters yet — filters are a deepening, not a skeleton requirement). This is the first thing a farmer needs to exist before booking is possible.
4. **Booking service (minimal)** — Farmer requests a booking for a date range on a listed equipment; server computes price; conflict constraint enforced; status starts at `pending`. Owner can approve/reject from a bare-minimum dashboard view. This is the core value proposition and the most architecturally load-bearing piece (state machine + conflict detection) — must be proven correct before anything is layered on top.
5. **Notification (minimal)** — A notification row is written on booking create/approve/reject. Display can be as simple as a list on a dashboard page (no Realtime, no bell icon yet) — the point of the walking skeleton is that the row exists and is visible somewhere, not that it is elegant.
6. **AI integration layer (minimal)** — One `/api/chat` Route Handler wired to NVIDIA NIM, one simple chat widget, FAQ-only, no tool-calling, no DB access. This proves the AI layer is wired end-to-end (env var loads, API call succeeds, response renders) independent of marketplace logic — exactly what the project context calls for.

At the end of Phase 1, a single farmer and a single owner account should be able to: sign up with roles, list one piece of equipment, request and approve one booking with a correct server-computed price and no possibility of double-booking, see one notification about it, and get one working answer from the chatbot. That is the entire walking skeleton — deliberately thin on every axis, but with zero missing layers.

### Phase 2+ — Deepen Per Slice (suggested order)

Order deepening by **dependency direction and risk**, not by visual impressiveness:

1. **Booking state machine completion** — Add `completed`/`cancelled` transitions, since reviews and the full dashboard depend on a booking reaching `completed`. Do this before reviews, because reviews have a hard dependency on booking status.
2. **Listing search/filters** — Category, location, availability-aware filtering. This deepens the listing service that Phase 1 left intentionally flat; do it before dashboard richness because farmers acquiring more listings to choose from is higher core-value than dashboard polish.
3. **Reviews** — Now unlockable because completed bookings exist. Straightforward CRUD + RLS condition tied to booking status (Anti-Pattern-safe per Pattern 3 above).
4. **Dashboards (owner + farmer) richness** — Stats, history, richer booking-request views. Depends on bookings/reviews/notifications all existing in at least minimal form, which they now do.
5. **Notifications deepening** — Move from "list on a page" to client-side Supabase Realtime subscription with a bell icon and unread counts. This is purely additive to the existing notification-row writing logic — no rework needed, just a better read-side.
6. **AI layer deepening** — Tool-calling into the existing listing/booking services ("find me a tractor near X", "what's the status of my booking"), still going through the same service-layer validation as the UI does — never a new bypass path. Do this last among functional slices because it is the least core-value-critical and depends on listing/booking services being stable enough to safely expose as tools.
7. **Dedicated UI/design polish phase** — Per project context, explicitly deferred until all of the above functional slices run end-to-end, so visual work never blocks or gets thrown away by functional changes underneath it.

This ordering means every phase after Phase 1 deepens exactly one named component from the architecture diagram without requiring changes to the component boundaries themselves — the service-layer/Server-Action/RLS structure chosen for the skeleton is the same structure used at full depth.

## Sources

- [Simplifying Time-Based Queries with Range Columns — Supabase official blog](https://supabase.com/blog/range-columns) — HIGH confidence, official Supabase source confirming `EXCLUDE USING gist` + `daterange` as the recommended booking-conflict pattern
- [Prevent overlapping date intervals in Postgres with a room booking example](https://axellarsson.com/blog/postgres-prevent-overlapping-time-inteval/) — MEDIUM confidence, corroborates the EXCLUDE constraint pattern with a directly analogous booking example
- [PostgreSQL's GiST Exclusion Constraint: The Database-Level Answer to Double Bookings](https://amitavroy.com/articles/postgresql-gist-exclusion-constraintthe-database-evel-answer-to-double-bookings) — MEDIUM confidence, corroborating independent source
- [Avoiding range overlaps in PostgreSQL with EXCLUDE constraint, better than serializable or assertions — DEV Community](https://dev.to/franckpachot/postgresql-exclude-constraints-for-better-concurrency-than-serializable-pob) — MEDIUM confidence, explains why this beats application-level locking under concurrency
- [Server Actions vs Route Handlers: When to Use Each in Next.js — Makerkit](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) — MEDIUM confidence, widely corroborated decision rule (human-triggered → Server Action, machine-triggered → Route Handler) across multiple independent sources
- [Route Handler vs Server Action in Production for Next.js — Wisp CMS](https://www.wisp.blog/blog/route-handler-vs-server-action-in-production-for-nextjs) — MEDIUM confidence, corroborating production guidance
- [Data Validation in the Next.js Supabase Turbo kit — Makerkit](https://makerkit.dev/docs/next-supabase-turbo/security/data-validation) — MEDIUM confidence, "route writes through server, RLS for reads" pattern, from a maintained production starter kit
- [Securing Your Next.js API Calls with Supabase Service Keys — Medium](https://medium.com/@zgza778/securing-your-next-js-api-calls-with-supabase-service-keys-1d6f024b3cd2) — LOW/MEDIUM confidence, single-author source, used only as corroboration for service-role isolation pattern, not as primary basis
- [Getting Started: Next.js App Router — AI SDK official docs](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — HIGH confidence, official documentation for the streaming Route Handler + `useChat` pattern
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK — LogRocket](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/) — MEDIUM confidence, corroborating production tutorial
- [Sending Push Notifications — Supabase official docs](https://supabase.com/docs/guides/functions/examples/push-notifications) — HIGH confidence, official pattern for trigger-driven notification fan-out (relevant for later deepening, not Phase 1)
- [best strategy for adding push notifications? — supabase/discussions #13930](https://github.com/orgs/supabase/discussions/13930) — MEDIUM confidence, maintainer/community discussion on trigger-based notification trade-offs
- [Publish and Subscribe to Realtime Data on Vercel — Vercel Knowledge Base](https://vercel.com/kb/guide/publish-and-subscribe-to-realtime-data-on-vercel) — HIGH confidence, official Vercel guidance confirming client-side-only Realtime subscriptions are the correct pattern under serverless execution limits (directly informs the Hobby-plan-compatible notification design above)

---
*Architecture research for: Two-sided rental/booking marketplace (Next.js App Router + Supabase)*
*Researched: 2026-06-26*
