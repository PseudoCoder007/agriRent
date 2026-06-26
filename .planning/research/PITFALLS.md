# Pitfalls Research

**Domain:** Farm equipment rental marketplace (two-sided: owners + renters), Next.js 15 + Supabase + Vercel Hobby + NVIDIA NIM
**Researched:** 2026-06-26
**Confidence:** HIGH (Supabase RLS, Postgres exclusion constraints, Vercel limits, OWASP price-tampering are all well-documented with official docs and convergent community sources). MEDIUM on NVIDIA NIM specifics (forum-sourced, NVIDIA's official rate-limit page is not consistently published per-model).

## Critical Pitfalls

### Pitfall 1: RLS infinite recursion when a policy checks a `role` column on the same table it's protecting

**What goes wrong:**
AgriRent's schema has a single `users` table with a `role` column (`farmer`/`owner`) used everywhere to gate access (e.g., "only owners can insert into `equipments`", "only the booking's owner or renter can see a booking"). The natural-looking policy is something like:
```sql
CREATE POLICY "owners can insert equipment" ON equipments
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
);
```
If `users` itself also has an RLS policy that re-queries `users` (e.g., to let users read their own profile via a subquery), Postgres detects the self-referencing policy chain and throws `"infinite recursion detected in policy for relation users"`. This also silently bites you when a `bookings` policy checks `equipments.owner_id` which checks `equipments` RLS which checks `users` RLS which checks `bookings` RLS — multi-table policy chains recurse just as easily as single-table ones.

**Why it happens:**
Developers model role-checking the same way they'd write an app-layer permission check — a subquery into the table that itself carries RLS — without realizing the subquery is *also* subject to RLS evaluation, creating a cycle. This is the single most common Supabase RLS bug for any app with a `role` or `owner_id` column used in policies on multiple tables.

**How to avoid:**
- Never query an RLS-protected table from inside another table's policy directly. Instead, wrap the role/ownership check in a `SECURITY DEFINER` function written in `LANGUAGE plpgsql` (not `SQL` — Postgres inlines simple SQL functions, which silently strips the `SECURITY DEFINER` context and reintroduces recursion).
- Example: `CREATE FUNCTION is_owner() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (SELECT role = 'owner' FROM users WHERE id = auth.uid()); END; $$;` then policies call `is_owner()`.
- Store role in the JWT custom claims (via a Supabase Auth Hook) as an alternative — checking `(auth.jwt() ->> 'user_role') = 'owner'` avoids touching `users` at all during policy evaluation, and is the pattern Supabase itself recommends for role-gated apps.
- Wrap `auth.uid()` calls in `(select auth.uid())` in every policy — this is also a meaningful query-planner optimization (caches the result via initPlan instead of re-evaluating per row), not just a recursion fix.

**Warning signs:**
- Any query against a protected table inexplicably returns "infinite recursion detected in policy for relation X" — this is the *good* case, it's a loud Postgres error, not silent data leakage.
- Slower-than-expected queries on `equipments`/`bookings` listing pages as data grows — often means policies are re-evaluating role/ownership subqueries per-row instead of via cached function results.

**Phase to address:**
Phase 1 (walking skeleton) — this is foundational schema/RLS work, not something to defer. Getting the RLS pattern right in the very first phase (auth → equipment → booking) prevents a full RLS rewrite later when reviews/notifications/favorites tables stack more policies on top.

---

### Pitfall 2: Application-level overlap checks for bookings ("check then insert") instead of a database-enforced exclusion constraint

**What goes wrong:**
The natural way to prevent double-booking is: on booking creation, run a `SELECT` to check whether any existing `approved`/`pending` booking overlaps the requested date range for that equipment, and if none found, `INSERT`. Under concurrent requests — two farmers requesting the same equipment for overlapping dates within milliseconds of each other — both requests can pass the `SELECT` check (neither sees the other's not-yet-committed row) and both `INSERT` succeed. Result: two confirmed bookings for the same equipment on overlapping dates. This is a classic check-then-act race condition, and it gets *worse*, not better, the more popular a listing is (exactly the equipment most likely to get simultaneous requests).

**Why it happens:**
The bug is invisible in manual testing (one developer, one browser tab, sequential clicks) and only appears under real concurrent load — which for a college/portfolio project might mean "two graders testing at once" or a demo where this exact scenario is the showcase. Developers reach for app-level logic because it feels like normal business logic, not realizing Postgres has a purpose-built primitive for exactly this problem.

**How to avoid:**
Use a PostgreSQL `EXCLUDE` constraint with the `btree_gist` extension — this makes overlapping bookings for the same equipment structurally impossible to insert, regardless of race conditions, regardless of which code path attempts the insert (API route, admin tool, future bulk script):
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'approved'));
```
The `WHERE` clause is critical: only `pending`/`approved` bookings should block new overlapping requests; `rejected`/`cancelled`/`completed` bookings should not. On the application side, catch Postgres error code `23P01` (`exclusion_violation`) specifically and translate it into a friendly "these dates are no longer available" response — do not let it bubble up as a generic 500. This combines defense-in-depth: keep the pre-check `SELECT` for fast UX feedback (gray out unavailable dates), but the constraint is the actual source of truth that prevents corruption.

**Warning signs:**
- Booking creation logic that does `SELECT ... overlap check` followed by a separate `INSERT` with no DB-level constraint backing it up.
- No `btree_gist` extension enabled, no `EXCLUDE USING gist` constraint visible in the `bookings` table migration.
- Manual QA "looks fine" because it was tested by one person clicking sequentially.

**Phase to address:**
Phase 1 (walking skeleton), specifically the booking-creation slice. This is explicitly called out in PROJECT.md's core value ("no double-booking") — it must be a server/DB-level guarantee from the first working booking flow, not bolted on later. Verification: write a quick concurrent-insert test (two simultaneous requests for the same equipment/overlapping dates) and confirm one fails with `23P01`.

---

### Pitfall 3: Trusting any client-submitted price, total, or rate — even "just for display" fields that get reused

**What goes wrong:**
The booking form needs to show the farmer a calculated total ("3 days × ₹500/day = ₹1500") before submission. The fast way to build this is to calculate it in the browser (React state) and submit `total_amount` as part of the booking payload. An attacker (or just a buggy client after a rate-edit race) can intercept that request and submit any `total_amount` value — this is the single most common real-world e-commerce/booking vulnerability category (parameter tampering via intercepted requests, well documented in OWASP-style writeups, including real cases like a booking platform where a price field was changed from 950 to 10 and accepted unchanged by the server).

**Why it happens:**
Calculating the total client-side feels efficient (no extra round-trip, instant UI feedback) and many tutorials show the total being passed straight from form state to the insert call. The mistake compounds when the equipment's `hourly_rate`/`daily_rate` is *also* read from client state (e.g., from a stale page load) rather than re-fetched from the DB at submission time — even without malicious intent, this causes incorrect totals if an owner changes rates between page load and booking submission.

**How to avoid:**
- Treat the client-submitted total purely as a UI preview, never as data. The booking API route must independently fetch the equipment's current `hourly_rate`/`daily_rate` from the database by `equipment_id`, compute `total_amount = rate * duration` server-side, and store that computed value — full stop, regardless of what the client sent.
- Apply this same rule to anything derived from price: discounts, deposit amounts, late-return fees (if added later for payments in v2).
- Add a Zod schema for the booking creation payload that does *not* even accept `total_amount` as an input field — if the field isn't in the schema, there's no path for a tampered value to reach the handler at all (better than accepting-then-ignoring it).
- Use integer (paise/cents) or `numeric` types server-side for money math, not floats, to avoid rounding-error edge cases compounding over date ranges.

**Warning signs:**
- Any booking/checkout API route that destructures `total_amount`, `price`, or `amount` directly from `req.body` and persists it without a server-side recompute.
- Equipment rate displayed in the booking form is read from a prop/client cache rather than being re-validated against the DB at submit time.

**Phase to address:**
Phase 1 (walking skeleton) — PROJECT.md already names this explicitly as a constraint ("Booking integrity... must be validated/computed server-side, never trusted from client"). This must be true from the very first booking write path, since retrofitting it later means auditing every place a price ever touched client code.

---

### Pitfall 4: Vercel Hobby serverless functions assumed to behave like a long-running Node server (connections, background work, streaming)

**What goes wrong:**
Three related failure modes, all stemming from treating a Vercel Hobby function like an always-on server:
1. **Connection exhaustion:** Each serverless invocation can open a new Postgres connection. Under even modest concurrent traffic (a few simultaneous booking requests, or grader/demo traffic), this can exceed Supabase's direct Postgres connection limit, producing "too many connections" / "max client connections reached" errors that look like random intermittent outages.
2. **Background work disappears:** Anything that assumes "fire an async task and let it keep running after the response is sent" (e.g., "send a notification in the background after responding") gets killed when the function returns — Vercel functions don't keep running post-response on Hobby the way a persistent Express server would.
3. **AI streaming/timeout mismatch:** The default function duration historically trips people up; with Fluid Compute the modern default is up to 300s on Hobby, but a function that hangs because a downstream call (NVIDIA NIM) never resolves, or that buffers a full LLM response before sending anything, can still exceed limits or simply feel slow/dead since nothing streams to the client until the whole thing is done.

**Why it happens:**
Local development with `next dev` masks all three problems — it's a single persistent process so connection reuse looks fine, background promises appear to complete, and slow AI calls just look like a slightly long request. These only surface after deployment, often during the live demo/grading session that matters most for a portfolio project.

**How to avoid:**
- Use Supabase's pooled connection string (Supavisor, transaction mode, port 6543) for all serverless/edge function database access — never the direct connection string. Note transaction-mode pooling does not support prepared statements or session-level `SET`/advisory locks; if using an ORM like Prisma, add `?pgbouncer=true` to disable prepared statements.
- Never rely on "fire and forget" async work after sending a response. If a task needs to run after the main work (e.g., notification creation on booking status change), do it synchronously before responding, or accept that it's part of the request's critical path — there is no reliable background execution on Hobby.
- For the AI chatbot, stream the response (Server-Sent Events via the AI SDK or a manual `ReadableStream`) rather than buffering the full NIM completion before responding — this both feels faster to the user and avoids the function appearing to hang with zero bytes sent for several seconds.
- Set an explicit, generous `maxDuration` on the chat route specifically (e.g., 60s) since LLM calls are the slowest part of this stack; keep other routes (booking CRUD) at sane low defaults since they should never legitimately take that long — a stuck booking route hints at a bug, not normal latency.

**Warning signs:**
- Intermittent 500s under almost any concurrent load that don't reproduce locally.
- "It worked when I tested it alone but failed during the demo with multiple people clicking."
- Code that does `someAsyncSideEffect()` without `await` and without it being on the response's critical path.
- The AI chat route shows nothing in the UI for 5-10+ seconds, then dumps the full answer at once.

**Phase to address:**
Phase 1 for connection pooling (must use pooled connection string from the very first DB-touching API route — retrofitting later means touching every query path). AI streaming specifically belongs to the Phase 1 AI slice (the chatbot is explicitly called out as proving the AI layer end-to-end) — get streaming right when the chatbot is first wired, not as a later optimization.

---

### Pitfall 5: NVIDIA NIM rate limits (low RPM on free tier) and credit exhaustion treated as "won't happen to a small project"

**What goes wrong:**
NVIDIA NIM's free/personal tier defaults to a low requests-per-minute ceiling (community reports converge around 40 RPM without a credit card, with developers requesting increases to 200 RPM for production use) plus a finite signup credit allotment (reports of ~1,000 inference credits, up to 5,000 on request) — these are not unlimited, contrary to how "free API" sounds. A chatbot feature with no client-side debounce, no per-user rate limiting, and no retry/backoff will hit HTTP 429 responses faster than expected — e.g., during a live demo where multiple people test the chatbot simultaneously, or where a buggy client retries on every keystroke. Once 429s start, naive code either crashes the route (uncaught error → ugly 500 in front of evaluators) or silently shows nothing.
The originally-requested `minimax-m2.5` model is also confirmed dead (HTTP 410) — a reminder that NIM's free-tier model catalog changes; the currently working model (`meta/llama-3.1-8b-instruct`) is not guaranteed permanent either.

**Why it happens:**
"It's a free API key, it works in my Postman test" gives false confidence — single manual tests never hit RPM limits. Treating an LLM call exactly like any other typically-fast backend call (no retry, no graceful degradation message) is the default unless the developer has specifically built against a rate-limited API before.

**How to avoid:**
- Wrap every NIM call in try/catch that specifically checks for HTTP 429 and `5xx`, and surface a friendly "the assistant is busy, try again in a moment" message in the chatbot UI rather than a raw error.
- Add basic exponential backoff with a small retry cap (2-3 retries max) for 429/503 responses — not unlimited retries, which would just compound the rate-limit pressure.
- Debounce/throttle on the client so the chatbot doesn't fire a request per keystroke or allow rapid repeated submits while a prior request is in flight (disable the send button until the current response completes or errors).
- Keep the system prompt and conversation history short and bounded — don't accumulate unbounded chat history into every request; this both reduces token/credit usage and keeps latency predictable under the Vercel function duration budget.
- Treat the model name as configuration, not a hardcoded literal sprinkled across files — one place to swap if NVIDIA deprecates the current model again.
- Never display or log the raw `NVIDIA_API_KEY` value in error messages shown to the client; scrub provider error bodies before relaying them to the frontend.

**Warning signs:**
- No try/catch around the NIM client call, or a catch block that just does `console.log(error)` and lets the route 500.
- No loading/error state distinct from "normal" state in the chat UI.
- Chat history sent to the API grows unbounded across a long conversation.

**Phase to address:**
Phase 1 (AI slice of the walking skeleton) — error handling and basic backoff should ship with the very first working chatbot call, since this is the integration most likely to visibly break during a live demo if untreated.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| App-level overlap check without DB exclusion constraint | Faster to write, no extension setup | Double-booking under any concurrency — undermines the project's stated core value | Never — this is explicitly called out as a must-fix in PROJECT.md |
| Client-calculated `total_amount` accepted as-is | Saves a DB round trip in the booking handler | Price tampering vulnerability, the exact stated anti-goal | Never |
| Direct (non-pooled) Postgres connection string in API routes | Works fine in solo local testing | Connection exhaustion the moment more than a couple of concurrent requests hit prod | Never on Vercel serverless — use pooled connection string from day one |
| Skipping `WHERE status IN (...)` filter on the exclusion constraint | Slightly simpler SQL | Cancelled/rejected bookings permanently block those dates for new requests | Never |
| No retry/backoff on NIM calls | Less code in Phase 1 | Chatbot appears broken under any real concurrent or repeated use, worst during a demo | Acceptable only for the very first smoke-test commit, must be hardened before calling Phase 1 "done" |
| RLS policy that queries the same/related table directly instead of via `SECURITY DEFINER` function | Looks like normal SQL, no extra function to write | Infinite recursion errors or, worse, accidentally permissive fallback policies written to "fix" the recursion | Acceptable only in a throwaway prototype never deployed with real data |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Postgres + Vercel serverless | Using the direct (5432) connection string in API routes | Use the pooled Supavisor/PgBouncer connection string (port 6543, transaction mode) for all serverless DB access |
| Supabase RLS + roles | Policy subqueries directly into an RLS-protected `users`/`equipments`/`bookings` table | Wrap checks in a `plpgsql` `SECURITY DEFINER` function, or read role from JWT claims |
| Supabase Storage uploads | Validating file type/size only in the React form (client-side) | Set `allowed_mime_types` and size limits at the bucket level server-side; never rely on client validation alone |
| NVIDIA NIM (OpenAI-compatible client) | Assuming unlimited free usage, no 429 handling | Add retry/backoff for 429/5xx, debounce client requests, bound conversation history sent per call |
| Vercel Functions + AI responses | Buffering the full LLM response before sending anything to the client | Stream the response (SSE) so the UI shows progress immediately and avoids appearing hung |
| Vercel Functions + "background" work | Firing an async side-effect (e.g., notification insert) without awaiting it before responding | Await all side effects before returning the response; there's no guaranteed post-response execution on Hobby |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| RLS policy re-evaluating `auth.uid()` / role lookups per row instead of via cached subplan | Listing pages (equipment search, bookings list) get progressively slower as row counts grow | Wrap auth calls as `(select auth.uid())`; index columns used in policy `WHERE`/`EXISTS` clauses (e.g. `owner_id`, `user_id`) | Becomes noticeable once `equipments`/`bookings` rows reach the low thousands — easily hit even in a college-project demo dataset if seeded generously |
| Direct Postgres connections from serverless functions | Intermittent "too many connections" / 500s under concurrent demo traffic | Use pooled connection string (Supavisor transaction mode) from the first DB call | Breaks with as few as 10-20 simultaneous requests depending on Supabase plan's connection cap |
| Unbounded chat history sent to NIM on every chatbot turn | Slower responses over a long conversation, faster credit/rate-limit exhaustion | Cap history to last N turns or a token budget | Noticeable after roughly 10+ message turns in one session |
| Equipment image uploads with no size/dimension cap | Slow listing pages, large Supabase Storage egress, slow first paint on equipment cards | Enforce bucket-level size limit + client-side resize/compress before upload | Becomes visible the first time someone uploads an uncompressed phone photo (often 5-10MB) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-submitted `total_amount`/rate fields | Farmers could book equipment for arbitrary near-zero prices | Recompute total server-side from the DB-stored equipment rate on every booking write; exclude `total_amount` from the accepted input schema entirely |
| RLS enabled on table but no policies added ("fail closed" assumed, but developer forgets and ships an open table) | Forgetting to enable RLS on a new table (e.g., `favorites`, `notifications` added later) leaves it world-readable/writable via the anon key | Enable RLS immediately when a table is created, in the same migration, before any data is seeded; add a project checklist/test that asserts RLS is enabled on every table |
| Role check based on `user_metadata` (client-editable JWT claim) instead of a server-controlled role source | A farmer could self-promote to `owner` by editing client-controlled metadata, gaining listing-creation rights | Store role in the `users` table (server-controlled) or in `app_metadata`/custom claims set only via a secure server-side Auth Hook — never trust `user_metadata` for authorization |
| File upload validated only client-side (file picker `accept` attribute) | Malicious file (e.g., script disguised with image extension) uploaded to Storage and potentially served back to other users | Configure bucket `allowed_mime_types` and size limits server-side; consider re-encoding/validating image headers, not just extension |
| NIM API key referenced anywhere in client-visible code or committed planning docs | Key leak enables unauthorized usage against the developer's quota/credits | Keep key server-side only (API route/service layer), `.env.local` gitignored — already correctly called out in PROJECT.md constraints |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Booking form shows a calculated total but the actual DB-saved amount could legitimately differ if rates changed between page load and submit | Farmer sees one number, gets charged/billed a different one, feels cheated even though it's not malicious | Re-fetch current rate at submit time and show a brief "confirm this price" step if it changed since page load |
| No visible "these dates are unavailable" feedback until the booking is rejected by the exclusion constraint | Farmer fills out the whole form, submits, gets a confusing generic error | Pre-check availability client-side (best-effort) and gray out/disable known-booked date ranges, then handle the rare race-condition failure with a clear "just got booked" message |
| Chatbot gives no feedback while waiting for NIM response | Feels broken/frozen, users assume the feature doesn't work and abandon it | Show a typing/loading indicator immediately; stream partial tokens as they arrive |
| Booking status changes (approved/rejected) with no notification surfaced promptly | Farmer has no idea their request was handled, keeps checking manually or assumes it's broken | In-app notification created synchronously as part of the same status-change transaction, not as an afterthought background task |

## "Looks Done But Isn't" Checklist

- [ ] **Double-booking prevention:** Often "works" in manual single-user testing but has no DB-level `EXCLUDE` constraint — verify by attempting two concurrent overlapping booking requests (e.g., two terminal tabs firing simultaneous `fetch` calls) and confirming exactly one succeeds.
- [ ] **Server-side price computation:** Often looks correct because the client also computes the same number — verify by sending a booking request with a deliberately wrong `total_amount` (or omitting it) via curl/Postman and confirming the stored value still matches the DB rate × duration.
- [ ] **RLS coverage:** Often "enabled" on the obvious tables (`equipments`, `bookings`) but forgotten on tables added later (`favorites`, `notifications`, `equipment_images`, `reviews`) — verify with a query listing all tables and their `rowsecurity` flag, cross-checked against policy counts per table.
- [ ] **Role-based access boundaries:** Often only tested for the "happy path" role (owner sees owner stuff) — verify a farmer account cannot read/write another user's bookings, and an owner cannot edit another owner's equipment, by direct API calls (not just UI navigation, which can hide unauthorized links without blocking the underlying request).
- [ ] **AI chatbot resilience:** Often only tested with one happy request — verify behavior under a simulated 429 (or just hammering the endpoint several times quickly) and confirm the UI degrades gracefully instead of crashing.
- [ ] **File upload validation:** Often only enforced via the `<input accept="image/*">` attribute — verify the bucket itself rejects an oversized or wrong-mime-type file when uploaded via a direct API call bypassing the form.
- [ ] **Connection pooling:** Often invisible until concurrent load — verify the Supabase connection string used in Vercel env vars is the pooled (port 6543) one, not the direct (5432) one.
- [ ] **Review-gating on completed bookings:** Often enforced only in the UI (hide the review button unless completed) — verify the API/RLS layer also rejects a review insert against a `pending`/`approved`/`cancelled` booking via a direct request.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| Double-booking already occurred in production/demo data | LOW | Add the `EXCLUDE` constraint going forward (it only blocks future inserts); manually resolve existing conflicting bookings via owner contact/cancellation; backfill a migration to flag conflicts for review |
| RLS infinite recursion discovered after several policies are written | MEDIUM | Refactor role/ownership checks into one or two `SECURITY DEFINER plpgsql` helper functions, then update each affected policy to call the function instead of querying the table directly; re-test each table's CRUD paths under both roles |
| Client-trusted price field already shipped and used in some bookings | LOW | Add server-side recompute on the write path going forward (does not require a data migration since past totals were presumably correct in good-faith testing); add a Zod schema that strips the client-submitted field |
| Direct (unpooled) DB connection string discovered in production | LOW | Swap the connection string env var to the pooled one and redeploy — no code changes needed if using a standard Postgres client; verify no code relies on session-level features unsupported by transaction-mode pooling (advisory locks, prepared statements) |
| NIM rate limit hit repeatedly during demo | LOW | Add backoff/retry and a friendly error state; if persistent, request a rate-limit increase from NVIDIA or fall back to a secondary key/provider for the demo window |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS infinite recursion / role-check anti-pattern | Phase 1 (auth + equipment + booking schema/RLS setup) | All CRUD operations tested under both `farmer` and `owner` roles with no recursion errors; policies use `SECURITY DEFINER` helper functions or JWT claims, not direct cross-table subqueries |
| Booking double-booking race condition | Phase 1 (booking creation slice) | `btree_gist` exclusion constraint present in migration; concurrent-insert test confirms exactly one of two overlapping requests succeeds with a `23P01` error on the loser |
| Client-trusted price/total | Phase 1 (booking creation slice) | Booking creation Zod schema excludes `total_amount` as input; manual test with tampered/omitted total confirms server-computed value is stored regardless |
| Vercel connection exhaustion | Phase 1 (first DB-touching API route) | Connection string in env vars is the pooled (6543) Supavisor URL; basic concurrent load test (several simultaneous requests) does not produce connection errors |
| NIM rate-limit/error handling | Phase 1 (AI chatbot slice) | Chatbot route has try/catch around 429/5xx with user-facing fallback message and bounded retry; repeated rapid testing does not crash the route |
| Storage upload validation bypass | Phase 1 or whichever phase adds equipment image upload | Bucket-level `allowed_mime_types` and size limit configured; direct API upload of a disallowed type/oversized file is rejected server-side, not just hidden in the UI |
| Review-gating on booking status | Phase covering reviews feature | RLS/API layer rejects review inserts against non-`completed` bookings, verified via direct request bypassing the UI |

## Sources

- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS: Common Mistakes, the (select auth.uid()) Trap & CVE-2025-48757 Breakdown](https://vibeappscanner.com/supabase-row-level-security)
- [Supabase Docs | Troubleshooting | RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Infinite recursion when using users table to specify users role for RLS · supabase discussion #1138](https://github.com/orgs/supabase/discussions/1138)
- [Infinite recursion in Postgres RLS: a SECURITY DEFINER gotcha - DEV Community](https://dev.to/bairescodeai/infinite-recursion-in-postgres-rls-a-security-definer-gotcha-1916)
- [Fixing Row-Level Security (RLS) Misconfigurations in Supabase: Common Pitfalls - ProsperaSoft](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/)
- [PostgreSQL's GiST Exclusion Constraint: The Database-Level Answer to Double Bookings](https://amitavroy.com/articles/postgresql-gist-exclusion-constraintthe-database-evel-answer-to-double-bookings)
- [Avoiding range overlaps in PostgreSQL with EXCLUDE constraint, better than serializable or assertions - DEV Community](https://dev.to/franckpachot/postgresql-exclude-constraints-for-better-concurrency-than-serializable-pob)
- [How to Solve Race Conditions in a Booking System | HackerNoon](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system)
- [Price Manipulation in E-commerce Applications Through Client-Side Controls and Business Logic Flaws | Sourcery](https://www.sourcery.ai/vulnerabilities/price-manipulation-ecommerce)
- [Breaking E-Commerce: How Client-Side Price Manipulation Lets You Pay Whatever You Want | Medium](https://medium.com/@oopssec-store/breaking-e-commerce-how-client-side-price-manipulation-lets-you-pay-whatever-you-want-6b78b0fac2b9)
- [Vercel Functions Limits (official docs)](https://vercel.com/docs/functions/limitations)
- [What can I do about Vercel Functions timing out? | Vercel Knowledge Base](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Getting max connection reached using supavisor · supabase discussion #18986](https://github.com/orgs/supabase/discussions/18986)
- [Preventing "Max client connections reached" Errors · supabase discussion #22305](https://github.com/orgs/supabase/discussions/22305)
- [Postgres Connection Exhaustion with Vercel Fluid - Jökull Sólberg](https://www.solberg.is/vercel-fluid-backpressure)
- [I got rate limit error every time I use Nvidia NIM API - NVIDIA Developer Forums](https://forums.developer.nvidia.com/t/i-got-rate-limit-error-every-time-i-use-nvidia-nim-api/373385)
- [Request for NVIDIA NIM API Rate Limit Increase (40 to 200 RPM) - NVIDIA Developer Forums](https://forums.developer.nvidia.com/t/request-for-nvidia-nim-api-rate-limit-increase-40-to-200-rpm-personal-agentic-ai-development/373359)
- [NVIDIA NIM Free API: Rate Limits, Pricing & Keys](https://decodethefuture.org/en/nvidia-nim-api-explained/)
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK - LogRocket Blog](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)
- [Stream response gets truncated in vercel deployment · vercel/next.js discussion #69800](https://github.com/vercel/next.js/discussions/69800)
- [Standard Uploads | Supabase Docs](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase Storage: How to Implement File Upload Properly](https://nikofischer.com/supabase-storage-file-upload-guide)

---
*Pitfalls research for: Farm equipment rental marketplace (AgriRent)*
*Researched: 2026-06-26*
