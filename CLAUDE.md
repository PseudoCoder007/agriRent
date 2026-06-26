<!-- GSD:project-start source:PROJECT.md -->

## Project

**AgriRent**

AgriRent is a web-based farm equipment rental marketplace connecting equipment owners (who list tractors/machinery) with farmers who need to rent it. Owners manage listings and approve/reject booking requests; farmers search, filter, and book equipment for a date range. Built as a final-year college project and portfolio piece on Next.js 15 + Supabase, deployed on Vercel.

**Core Value:** A farmer can find available equipment near them and successfully book it for a date range, and the owner can approve or reject that request — end to end, with no double-booking and no client-side price tampering.

### Constraints

- **Tech stack**: Next.js 15 App Router, TypeScript only (no `.js` files), TailwindCSS + Shadcn UI, Supabase (Postgres + Auth + Storage + RLS), Vercel deployment — why: agreed stack for a full-stack app deployable entirely on Vercel's free Hobby plan.
- **Deployment limits**: Vercel Hobby plan has serverless function execution-time limits; no long-running background jobs or persistent WebSockets — why: free-tier constraint, ruled out real-time chat/live tracking for this reason too.
- **Code quality**: max 500 lines/file, ~80 lines/component, Server Components first, Zod for all validation, no raw SQL inside components (service layer only), API responses always shaped `{success, message, data}` — why: agreed conventions from prior discussion, keep enforced via CLAUDE.md.
- **Booking integrity**: date-range conflicts and total price must be validated/computed server-side, never trusted from client — why: prevents double-booking and price tampering, a real-world trust requirement for a rental marketplace.
- **Secrets**: `NVIDIA_API_KEY` lives only in `.env.local` (gitignored) — why: key was shared in plain chat text; must never be committed or echoed into planning docs.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Verdict on the Pre-Chosen Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | `15.5.x` (latest 15-line, e.g. 15.5.19) | Full-stack React framework, App Router | Already chosen; mature, stable, huge ecosystem overlap with Shadcn/Supabase guides; avoids being first-adopter of Next 16's Turbopack-default production build risk for a deadline-bound project |
| React | `19.x` | UI library (required by Next 15) | Next.js 15's minimum React version is 19 — not optional, it's a hard dependency |
| TypeScript | `5.x` (NOT the new major `6.x` unless verified compatible) | Type safety, no `.js` files per project constraint | npm registry shows `typescript@6.0.3` as latest; **verify Next.js 15's peer-dependency range before adopting TS 6** — Next.js 15 was built/tested against TS 5.x. Default to `"typescript": "^5.7.0"` unless you confirm TS6 compatibility in Next 15's own package.json |
| Supabase (Postgres + Auth + Storage + RLS) | `@supabase/supabase-js@2.108.x`, `@supabase/ssr@0.12.x` | Database, auth, file storage, row-level authorization | Already chosen; single hosted Postgres instance gives you RLS, Auth, and Storage without separately provisioning each — ideal for a free-tier, time-boxed project |
| TailwindCSS | `4.x` | Utility-first styling | Already chosen; Tailwind v4 is what current Shadcn CLI generates into by default — using v3 instead would fight the tooling |
| Shadcn UI | CLI-installed (no fixed "version" — components are copied into your repo) | Accessible, unstyled-then-themed component primitives (Radix-based) | Already chosen; confirmed fully compatible with React 19 + Next.js 15 + Tailwind v4 as of the canary release that shipped this support — current `npx shadcn@latest init` targets exactly this combination |
| Vercel | N/A (PaaS, not a package) | Deployment | Already chosen; zero-config Next.js deploys, generous Hobby free tier sufficient for a portfolio/demo app |
| Leaflet + React-Leaflet | `leaflet@1.9.4`, `react-leaflet@5.0.0` | Interactive map for location search/display | Already chosen; free, no API key, no usage caps — correct call for a budget-constrained college project. Note: react-leaflet 5.x requires React 19, which aligns with Next 15 |
| OpenStreetMap (tile provider) | N/A | Map tile data source for Leaflet | Free, no API key required for low-volume use (respect OSM's tile usage policy — for a portfolio demo with low traffic this is fine; if traffic grows, switch to a paid tile provider like MapTiler/Stadia, NOT raw OSM tile servers) |
| `openai` (official client) | `6.x` | Client for NVIDIA NIM (OpenAI-compatible endpoint) | NIM's API is OpenAI-schema-compatible; the official `openai` npm package works unmodified by overriding `baseURL` to `https://integrate.api.nvidia.com/v1` and `apiKey` to the NVIDIA key — no NVIDIA-specific SDK exists or is needed |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | `4.x` | Runtime schema validation | Already a project constraint ("Zod for all validation"); v4 has faster parsing and friendlier error shapes (`.flatten().fieldErrors`) than v3 for form-error mapping — use one schema file per entity (equipment, booking) shared between client form and server action |
| `react-hook-form` | `7.80.x` | Form state management | Pairs with Zod via `@hookform/resolvers` for listing/booking forms with multiple fields (dates, rates, images) — reduces re-render noise vs raw `useState` per field |
| `@hookform/resolvers` | `5.4.x` | Zod ↔ react-hook-form bridge | Needed wherever react-hook-form is used with a Zod schema |
| `date-fns` | latest 3.x/4.x | Date range math (booking start/end, overlap pre-checks in UI) | Use for client-side date display/formatting and pre-submit overlap warnings; do NOT rely on it for the actual conflict guarantee — that lives in Postgres (see Architecture notes) |
| `react-day-picker` (ships inside Shadcn's `Calendar`/`date-picker` blocks) | bundled via Shadcn | Date-range picker UI for booking requests | Use Shadcn's own date-range picker block rather than hand-rolling — it already wires to react-hook-form patterns |
| `sonner` (Shadcn's recommended toast) | latest | Toast notifications for booking status changes, form errors | Shadcn's current docs recommend `sonner` over the older deprecated `toast` component — use this, not the legacy one |
| `lucide-react` | latest | Icon set | Default icon library Shadcn components expect |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (Next.js's bundled config) | Linting | `create-next-app` ships `eslint-config-next` pinned to the Next major — keep in sync with Next 15 |
| Supabase CLI | Local migrations, type generation (`supabase gen types typescript`) | Run `supabase gen types typescript --linked > types/database.ts` after every schema change so Zod schemas and TS types don't drift from the real Postgres schema |
| Prettier | Formatting | Optional but recommended given the "max 500 lines/file" code-quality constraint — consistent formatting makes file-size review easier |

## Installation

# Scaffold (pin to Next 15, not whatever "latest" resolves to)

# Supabase

# Shadcn UI (run after scaffold; CLI copies components into your repo)

# Maps

# Validation + forms

# Dates

# AI client (NVIDIA NIM via OpenAI-compatible endpoint)

# Dev dependencies

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Next.js 15 | Next.js 16 | If this were a greenfield project with no deadline pressure and you wanted Turbopack-by-default production builds and the newest cache APIs. For a time-boxed college project shipping against a fixed feature list, staying on the well-documented 15 line reduces risk of hitting fresh 16 ecosystem bugs (e.g., third-party library peer-dep lag) |
| Leaflet + OSM | Mapbox GL JS (`react-map-gl`) | If the app needed WebGL-rendered maps with hundreds/thousands of markers, custom vector styling, or built-in geocoding/isochrone search at scale. Mapbox has a generous free tier but requires an API key + billing setup — unnecessary overhead for an MVP with a few dozen equipment listings |
| Leaflet + OSM | Google Maps JS API | If brand-familiarity ("looks like Google Maps") mattered more than cost, or you needed Google's geocoding/Places autocomplete quality. Costs scale with usage and requires billing-enabled API key — avoid for a free-tier portfolio project |
| `openai` client + NVIDIA baseURL | `@ai-sdk/openai-compatible` (Vercel AI SDK) | If you need streaming chat UI with built-in React hooks (`useChat`), tool-calling orchestration, or multi-provider abstraction. For a single FAQ-chatbot feature, the official `openai` package is simpler and has fewer moving parts |
| Postgres `EXCLUDE` constraint (btree_gist) | Application-level check + Postgres `SERIALIZABLE` transaction isolation | If you can't add a GiST exclusion constraint (e.g., heavily normalized schema makes the range expression awkward) — `SERIALIZABLE` is correct but causes more transaction retries/aborts under contention than the exclusion constraint approach |
| Zod v4 | Zod v3 | If a dependency you need still requires Zod v3 peer-dep (check before locking in v4) — at time of research, react-hook-form's resolvers support both, so this is unlikely to bite |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Trusting client-submitted `total_amount` or date-availability flags in the booking insert | Direct violation of the project's own stated trust requirement; client JS can be edited via devtools before submit | Compute `total_amount` server-side from the equipment's stored rate × duration inside the Server Action/API route, and re-validate availability against the DB at insert time |
| Relying only on a "check then insert" application-level overlap query (`SELECT ... WHERE NOT overlaps` then `INSERT`) as the *only* double-booking defense | Classic TOCTOU race condition — two concurrent requests can both pass the SELECT check before either INSERT commits, producing two overlapping bookings | Add a Postgres `EXCLUDE USING gist (equipment_id WITH =, daterange(start_date, end_date, '[]') WITH &&) WHERE (status != 'cancelled')` constraint (requires `CREATE EXTENSION btree_gist`) as the authoritative guarantee; keep the app-level check only as a fast-fail UX improvement, not the source of truth |
| `user_metadata` JWT claims inside RLS policies | `user_metadata` is editable by the authenticated user themselves via the Supabase Auth API — using it in a `USING`/`WITH CHECK` clause lets a user grant themselves elevated access | Store role (farmer/owner) in your own `users` table (server-controlled) and reference that table from RLS policies, or use `app_metadata` (server-only-writable) if staying within auth claims |
| `service_role` Supabase key in any client-side code or `NEXT_PUBLIC_*` env var | Bypasses RLS entirely — full database access if leaked | Use `service_role` only in trusted server-only contexts (Server Actions, Route Handlers) and only when you specifically need to bypass RLS for a controlled operation (e.g., an admin job); never prefix it `NEXT_PUBLIC_` |
| Plain `<img>` tags or unvalidated `<input type="file">` uploads straight to Supabase Storage | No size/type enforcement = arbitrarily large or wrong-type files land in storage, and Next's `<img>` skips optimization | Validate MIME type (`image/jpeg`, `image/png`, `image/webp`) and size (suggest capping at 5MB per image, well under Supabase's 50MB project-level default) on both client (UX) and server (security, since client checks are bypassable) before calling `storage.from(...).upload(...)`; use `next/image` for rendering |
| Importing `react-leaflet` map components directly into a Server Component or without `next/dynamic` | Throws `ReferenceError: window is not defined` during SSR/build — confirmed still an active issue against recent Next.js 15.x releases | Wrap the map in a dedicated `'use client'` component and import it via `dynamic(() => import('./Map'), { ssr: false })` from the page that renders it |
| Letting `create-next-app` resolve to whatever `latest` is without a version flag | `latest` now resolves to Next.js 16, contradicting the project's explicit Next 15 constraint | Always scaffold/install with an explicit `@15` or `^15.5.0` version pin |
| Building a custom JWT role-check by parsing tokens manually in middleware as the *only* authorization layer | Easy to get subtly wrong (e.g., forgetting to re-verify on every protected route) and doesn't protect direct database access (e.g., via Supabase client-side queries that bypass your Next.js middleware entirely) | Middleware/route guards for UX-level redirects, but RLS policies in Postgres as the actual authorization boundary — RLS applies no matter which path data is queried through |

## Stack Patterns by Variant

- Switch to Mapbox GL JS / `react-map-gl` for WebGL-accelerated rendering, or implement marker clustering (`react-leaflet-cluster`) first
- Because Leaflet's DOM-based rendering degrades with very high marker counts; clustering is the cheaper first fix before a full map-library migration
- Extend the exclusion constraint's equality column to a composite key, or normalize into a junction table with its own exclusion constraint
- Because a single-column equality term in `EXCLUDE USING gist` only scopes comparisons within that one column's matching value — multi-resource conflicts need the constraint's "partitioning" column(s) to match the real conflict scope
- Re-evaluate Vercel Hobby's 10-second function duration limit before integrating a payment gateway webhook handler — payment webhooks (e.g., Razorpay) sometimes need retries/idempotency handling that benefit from Fluid Compute's extended duration or a queue, not a bare serverless function
- Because payment webhook reliability requirements are stricter than booking CRUD, and Hobby's default limits were sized for typical request/response cycles, not payment provider retry semantics

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `next@15.5.x` | `react@19.x`, `react-dom@19.x` | Hard requirement — Next 15's minimum React version is 19, not optional |
| `react-leaflet@5.x` | `react@19.x` | react-leaflet 5 targets React 19; do not pair with react-leaflet 4.x (built for React 18) under Next 15 |
| `shadcn` CLI components | `tailwindcss@4.x`, `react@19.x` | Current Shadcn CLI generates Tailwind v4 + React 19 compatible code by default; older copy-pasted Shadcn snippets from pre-2025 tutorials may target Tailwind v3 syntax — regenerate via CLI rather than copying old blog code |
| `typescript@5.7+` | `next@15.x` | Stick to TS 5.x line; do not adopt `typescript@6.x` (current npm latest) without first confirming Next.js 15's own `package.json` peer-dependency range accepts it — this was not verified in this research pass and is a real risk if assumed compatible |
| `@supabase/ssr@0.12.x` | `next@15.x` App Router | This is the correct package for App Router cookie-based session handling — do not use the older `@supabase/auth-helpers-nextjs` (deprecated in favor of `@supabase/ssr`) |
| `btree_gist` extension | Postgres (any version Supabase provisions) | One-time `CREATE EXTENSION IF NOT EXISTS btree_gist;` migration; Supabase-hosted Postgres supports this extension out of the box |

## Sources

- [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15) — confirmed React 19 minimum, async request APIs — MEDIUM confidence (official docs via web search snippet, not Context7-verified)
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) — confirmed Next 16 is current `latest` dist-tag, Turbopack default — LOW confidence (web search synthesis)
- npm registry direct queries (`npm view <pkg> version` / `dist-tags`) — HIGH confidence (live registry data, not training data): `next` latest=16.2.9, 15-line latest=15.5.19; `react`=19.2.7; `zod`=4.4.3; `leaflet`=1.9.4; `react-leaflet`=5.0.0; `openai`=6.45.0; `@supabase/supabase-js`=2.108.2; `@supabase/ssr`=0.12.0; `tailwindcss`=4.3.1; `typescript`=6.0.3; `react-hook-form`=7.80.0; `@hookform/resolvers`=5.4.0
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy structure (USING/WITH CHECK), indexing guidance — MEDIUM confidence (web search synthesis of official docs)
- [Supabase RLS best practices — makerkit.dev](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — role-table pattern over `user_metadata`, performance indexing — LOW confidence (third-party blog via web search)
- [PostgreSQL GiST exclusion constraint for double bookings — amitavroy.com](https://amitavroy.com/articles/postgresql-gist-exclusion-constraintthe-database-evel-answer-to-double-bookings) — EXCLUDE/btree_gist pattern, concurrency advantages — LOW confidence (third-party blog via web search)
- [btree_gist extension — Neon Docs](https://neon.com/docs/extensions/btree_gist) — extension mechanics — MEDIUM confidence (vendor docs via web search)
- [Temporal Constraints in PostgreSQL 18 — Better Stack](https://betterstack.com/community/guides/databases/postgres-temporal-constraints/) — PG18's `WITHOUT OVERLAPS` syntax as future alternative — LOW confidence (third-party guide via web search)
- [react-leaflet GitHub issue #1152](https://github.com/PaulLeCam/react-leaflet/issues/1152) — confirms `window is not defined` still surfaces against recent Next.js 15.x — MEDIUM confidence (primary GitHub issue tracker via web search)
- [shadcn/ui React 19 docs](https://ui.shadcn.com/docs/react-19) — official compatibility statement and install flag guidance — MEDIUM confidence (official docs via web search snippet)
- [Supabase Storage file upload guides — supalaunch.com, nikofischer.com](https://supalaunch.com/blog/file-upload-nextjs-supabase) — size/MIME validation patterns — LOW confidence (third-party blogs via web search)
- [Zod v4 + Next.js Server Actions — technspire.com](https://technspire.com/en/blog/zod-v4-nextjs-server-actions-end-to-end-type-safety) — schema-sharing and safeParse pattern — LOW confidence (third-party blog via web search)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) and [Configuring Maximum Duration](https://vercel.com/docs/functions/configuring-functions/duration) — Hobby plan 10s default / Fluid Compute 300s ceiling — MEDIUM confidence (official docs via web search snippet)
- [NVIDIA NIM OpenAI-compatible providers — ai-sdk.dev](https://ai-sdk.dev/providers/openai-compatible-providers/nim) — confirms OpenAI-schema compatibility, baseURL swap pattern — MEDIUM confidence (vendor-adjacent docs via web search)
- [openai npm package](https://www.npmjs.com/package/openai) — official client usable against any OpenAI-compatible baseURL — MEDIUM confidence (npm registry page via web search)
- [3 Race Conditions in Next.js Server Actions — Medium](https://medium.com/@mehran.khanjan/3-race-conditions-hiding-in-your-next-js-server-actions-i-shipped-all-3-07a8daf7f515) — double-submit UI mitigation via `useFormStatus` — LOW confidence (third-party blog via web search)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

**General**
- Next.js App Router only, TypeScript everywhere, no `.js` files.
- Prefer Server Components; Client Components only when interactivity requires it.

**Code Quality**
- Max 500 lines per file, max ~80 lines per component where possible.
- Extract reusable logic into hooks or services. Avoid duplicate code.

**Folder Rules**
- `/components` — reusable UI only
- `/actions` — Server Actions only
- `/services` — database operations
- `/lib` — utilities
- `/types` — shared interfaces
- `/hooks` — reusable hooks

**Database**
- Never write raw SQL inside components. Always go through the service layer.
- Run `supabase gen types typescript --linked > types/database.ts` after every schema change.

**Validation & Forms**
- Zod for all validation — never trust frontend input.
- React Hook Form + `@hookform/resolvers` (Zod resolver) for forms.

**Styling**
- TailwindCSS + Shadcn UI. No inline styles.

**State**
- Server Components first. Reach for client state (e.g. Zustand) only if global state is genuinely required.

**Error Handling**
- Every API/Server Action returns `{ success, message, data }`. Never throw raw database errors to the client.

**Performance**
- Lazy load where sensible, optimize images via `next/image`, paginate lists, avoid unnecessary re-renders.

**Naming**
- PascalCase for components, camelCase for functions, UPPER_CASE for constants, kebab-case for folders.

**Git**
- Small commits, one feature per commit, meaningful messages.

**Booking integrity (non-negotiable — see PROJECT.md Core Value)**
- `total_amount` is always computed server-side from the equipment's stored rate; never trust a client-submitted price.
- Booking date-range conflicts are enforced by a Postgres `EXCLUDE USING gist` constraint (btree_gist), not just an application-level check — see `.planning/research/STACK.md` and `PITFALLS.md` for why a "check then insert" approach alone is insufficient.
- RLS policies must not read `user_metadata` (user-editable); store farmer/owner role in a server-controlled table.

**Secrets**
- `NVIDIA_API_KEY` and related AI config live only in `.env.local` (gitignored). Never commit it, never write it into a planning doc.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
