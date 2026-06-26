---
phase: 01-walking-skeleton
plan: 02
subsystem: auth
tags: [nextjs, supabase-auth, zod, react-hook-form, vitest, middleware, rbac]

# Dependency graph
requires:
  - phase: 01-walking-skeleton (plan 01)
    provides: Next.js scaffold, Supabase client wrappers (client/server/admin), live schema with users table + role enum, types/database.ts
provides:
  - Auth Zod schemas (signupSchema, loginSchema) restricting role to farmer/owner enum
  - auth.service.ts (signUp/logIn/logOut) wrapping Supabase Auth + public.users row creation, role read from public.users only
  - Server Actions (signUpAction/logInAction/logOutAction) with server-side role-based redirects
  - Single /signup form with farmer/owner RadioGroup control (D-01), /login form
  - LogoutButton Client Component embedded in both role layouts
  - (farmer)/(owner) route groups with real URL segments (/farmer/dashboard, /owner/dashboard) enforced by middleware + layout defense-in-depth
  - vitest added as the project's first test runner (service/schema-layer unit tests)
affects: [01-03, 01-04, 01-05, all later phases needing auth/role context]

# Tech tracking
tech-stack:
  added: ["vitest@^4.1.9 (devDependency)"]
  patterns: ["Server Action -> service layer -> Supabase client (RLS-respecting) for all auth mutations", "role always read from public.users.role, never auth.users.user_metadata", "route group (farmer)/(owner) wraps a real /farmer or /owner URL segment so middleware and layout redirects target valid paths", "two-layer role enforcement: middleware (fast UX redirect) + layout Server Component (defense in depth)"]

key-files:
  created:
    - vitest.config.ts
    - src/lib/validations/auth.schema.ts
    - src/lib/validations/auth.schema.test.ts
    - src/lib/services/auth.service.ts
    - src/app/actions/auth.actions.ts
    - "src/app/(auth)/signup/page.tsx"
    - "src/app/(auth)/login/page.tsx"
    - src/components/auth/logout-button.tsx
    - "src/app/(farmer)/layout.tsx"
    - "src/app/(farmer)/farmer/dashboard/page.tsx"
    - "src/app/(owner)/layout.tsx"
    - "src/app/(owner)/owner/dashboard/page.tsx"
  modified:
    - src/middleware.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Added vitest as the project's first test runner to satisfy Task 1's tdd=true RED/GREEN cycle for the Zod schema behavior tests — no test framework existed in the scaffold from Plan 01-01."
  - "logIn() in auth.service.ts was extended beyond the plan's literal spec to also fetch and return the user's role from public.users, because logInAction needs the role to redirect server-side to the correct dashboard (the plan text for Task 2 explicitly requires role-based redirect in both signUpAction and logInAction)."
  - "Route groups (farmer)/(owner) needed a real nested path segment (farmer/dashboard, owner/dashboard) inside each group, not just a bare dashboard/ folder — Next.js route groups are stripped from the URL, so two groups both containing dashboard/page.tsx collided on the same /dashboard path and failed the production build. Fixed by nesting: src/app/(farmer)/farmer/dashboard/page.tsx and src/app/(owner)/owner/dashboard/page.tsx, producing the correct /farmer/dashboard and /owner/dashboard URLs the plan, middleware, and layouts all already assumed."
  - "Created minimal placeholder dashboard pages (not specified in this plan's artifacts) because the signup/login/middleware/layout redirect targets (/farmer/dashboard, /owner/dashboard) would 404 without them, breaking the very auth flow this plan exists to prove works end-to-end (Rule 2 — missing critical functionality)."

patterns-established:
  - "Auth Server Actions parse with Zod .safeParse, call the service layer, and redirect server-side based on the service's returned role — never let the client choose its own post-auth destination."
  - "Service layer functions always return {success, message, data} and never relay raw Supabase error text to the caller (generic 'Invalid email or password' on login failure, generic account-creation failure message)."

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: ~55min
completed: 2026-06-26
---

# Phase 1 Plan 2: Auth + Role Boundary Summary

**Single `/signup` form with a farmer/owner radio control wired to a Zod-validated, service-layer-backed Supabase Auth flow; role-scoped `(farmer)`/`(owner)` route groups enforced by both middleware and per-layout server checks, with role read exclusively from `public.users.role`.**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-06-26T15:38:17Z (per STATE.md handoff from Plan 01-01)
- **Completed:** 2026-06-26
- **Tasks:** 3 of 3 completed
- **Files modified:** 14 created, 3 modified

## Accomplishments

- `signupSchema`/`loginSchema` (Zod) validate signup/login shapes with `role` restricted to `z.enum(["farmer", "owner"])`, proven via a RED→GREEN vitest cycle (first test framework added to this project)
- `auth.service.ts` exposes `signUp()`, `logIn()`, `logOut()`, each returning `{success, message, data}`, creating the matching `public.users` row on signup and never leaking raw Supabase error text (generic "Invalid email or password" on login failure)
- `auth.actions.ts` Server Actions parse input with the Task 1 schemas and redirect server-side to `/owner/dashboard` or `/farmer/dashboard` based on the role read back from `public.users`
- Single `/signup` form (one `<form>`, one `RadioGroup` with exactly two `RadioGroupItem`s for Farmer/Owner — satisfying D-01) and a `/login` form, both built with react-hook-form + `zodResolver` + default Shadcn components
- `LogoutButton` Client Component, embedded in both `(farmer)/layout.tsx` and `(owner)/layout.tsx` headers, reachable from every page in either role group
- `src/middleware.ts` extended to redirect unauthenticated users hitting `/farmer/*` or `/owner/*` to `/login`, and redirect role-mismatched users to their correct dashboard — fast UX-level guard, not the authorization boundary
- `(farmer)/layout.tsx` and `(owner)/layout.tsx` re-confirm session + role server-side (defense in depth beyond middleware), redirecting non-matching roles to the other dashboard
- Verified via grep that `user_metadata` does not appear anywhere in `middleware.ts` or either layout file — role is sourced only from `public.users.role` everywhere in this plan
- `npx tsc --noEmit`, `npx vitest run`, and `npm run build` (Turbopack production build) all pass clean

## Task Commits

Each task was committed atomically (Task 1 followed the TDD RED/GREEN cycle, producing two commits):

1. **Task 1 (RED): Failing test for auth Zod schemas** - `a279ee9` (test)
2. **Task 1 (GREEN): Auth Zod schemas implementation** - `29152c6` (feat)
3. **Task 1: Auth service layer (signUp/logIn/logOut)** - `819931f` (feat)
4. **Task 2: Server Actions, signup/login pages, logout button** - `23d268d` (feat)
5. **Task 3: Role-scoped route groups + middleware enforcement** - `62a5f94` (feat)

_Note: Task 1 was executed as a full TDD RED→GREEN cycle per its `tdd="true"` frontmatter; the service-layer half of Task 1 (no behavior tests specified in the plan) was committed separately as straightforward `feat`._

## Files Created/Modified

- `vitest.config.ts` - minimal Vitest config (node environment, `src/**/*.test.ts`), `@/` alias matching `tsconfig.json`
- `src/lib/validations/auth.schema.ts` - `signupSchema`, `loginSchema`, `SignupInput`, `LoginInput`
- `src/lib/validations/auth.schema.test.ts` - 5 tests covering valid/invalid signup and login payloads, role enum rejection
- `src/lib/services/auth.service.ts` - `signUp()` (Auth signup + `public.users` insert), `logIn()` (auth + role lookup), `logOut()`
- `src/app/actions/auth.actions.ts` - `signUpAction`, `logInAction`, `logOutAction` — Zod-parse, call service, role-based server redirect
- `src/app/(auth)/signup/page.tsx` - single signup form, react-hook-form + `zodResolver(signupSchema)`, farmer/owner `RadioGroup`
- `src/app/(auth)/login/page.tsx` - login form, react-hook-form + `zodResolver(loginSchema)`
- `src/components/auth/logout-button.tsx` - `'use client'` component calling `logOutAction` via `useTransition`
- `src/app/(farmer)/layout.tsx` - server-side role=farmer re-check, renders `LogoutButton` in header
- `src/app/(farmer)/farmer/dashboard/page.tsx` - placeholder farmer dashboard (real content lands in later plans)
- `src/app/(owner)/layout.tsx` - server-side role=owner re-check, renders `LogoutButton` in header
- `src/app/(owner)/owner/dashboard/page.tsx` - placeholder owner dashboard (real content lands in later plans)
- `src/middleware.ts` - extended with `/farmer`/`/owner` path-prefix branching, role lookup against `public.users`, redirect on mismatch
- `package.json` / `package-lock.json` - added `vitest` devDependency

## Decisions Made

- **Added vitest as first test runner:** Task 1 required a RED/GREEN TDD cycle but no test framework existed in the project yet (confirmed via `npm ls vitest jest`). Verified `vitest` is a legitimate, current npm package (`npm view vitest version` → `4.1.9`) before installing — not a guessed or substituted package name.
- **Extended `logIn()` to return role:** the plan's Task 2 action spec requires `logInAction` to redirect by role the same way `signUpAction` does, but the plan's literal Task 1 service spec for `logIn()` only described returning `{ userId }`. Reading `public.users.role` immediately after a successful sign-in (same server client, RLS-respecting) was the minimal change needed to satisfy Task 2's actual requirement without inventing a new architectural layer.
- **Real nested path segments for route groups:** `(farmer)/dashboard` and `(owner)/dashboard` both resolve to `/dashboard` once the route-group parens are stripped — Next.js's Turbopack build correctly rejected this as two parallel pages colliding on one path. Restructured to `(farmer)/farmer/dashboard/page.tsx` and `(owner)/owner/dashboard/page.tsx`, which is also what the plan's own redirect targets (`/farmer/dashboard`, `/owner/dashboard`) already assumed.
- **Removed `user_metadata` substring from explanatory comments:** the plan's Task 3 acceptance criteria literally greps for the substring `user_metadata` in `middleware.ts` and both layout files. The original comments mentioned `auth.users.user_metadata` only to explain what *not* to read from; reworded to "Auth-provided metadata" to satisfy the literal acceptance check while preserving the intent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restructured `(farmer)`/`(owner)` dashboard routes to avoid a path collision**
- **Found during:** Task 3 (verification — `npm run build`)
- **Issue:** `src/app/(farmer)/dashboard/page.tsx` and `src/app/(owner)/dashboard/page.tsx` both resolved to the URL `/dashboard` since Next.js strips route-group parentheses from the URL path. Turbopack's production build failed outright: "You cannot have two parallel pages that resolve to the same path."
- **Fix:** Moved each dashboard page one level deeper — `src/app/(farmer)/farmer/dashboard/page.tsx` and `src/app/(owner)/owner/dashboard/page.tsx` — producing the distinct `/farmer/dashboard` and `/owner/dashboard` URLs that the plan's middleware and layout redirect targets already referenced.
- **Files modified:** `src/app/(farmer)/farmer/dashboard/page.tsx` (new path), `src/app/(owner)/owner/dashboard/page.tsx` (new path)
- **Verification:** `npm run build` succeeds, route table shows `/farmer/dashboard` and `/owner/dashboard` as separate dynamic routes.
- **Committed in:** `62a5f94` (Task 3 commit)

**2. [Rule 2 - Missing Critical] Added placeholder `/farmer/dashboard` and `/owner/dashboard` pages**
- **Found during:** Task 3 (implementation)
- **Issue:** The plan's Task 2/3 redirect targets (`signUpAction`, `logInAction`, middleware, both layouts) all redirect to `/farmer/dashboard` or `/owner/dashboard`, but no page existed at either route — every successful signup/login would 404, breaking the auth flow this plan exists to prove end-to-end.
- **Fix:** Added minimal Server Component placeholder pages at both routes with a short explanatory note that real dashboard content lands in later plans (per SKELETON.md's notification/dashboard deepening sequence).
- **Files modified:** `src/app/(farmer)/farmer/dashboard/page.tsx`, `src/app/(owner)/owner/dashboard/page.tsx`
- **Verification:** `npm run build` lists both routes; manual review confirms each renders without requiring data this phase hasn't built yet.
- **Committed in:** `62a5f94` (Task 3 commit)

**3. [Rule 1 - Bug] Removed `user_metadata` substring from comments to satisfy Task 3's literal grep-based acceptance criteria**
- **Found during:** Task 3 (verification)
- **Issue:** Explanatory comments in `middleware.ts`, `(farmer)/layout.tsx`, and `(owner)/layout.tsx` referenced "auth.users.user_metadata" to explain what role source to avoid — but the plan's stated acceptance criteria is a literal substring check ("Neither file contains the substring `user_metadata`") with no exception for comments, and the comment's own presence would fail that check.
- **Fix:** Reworded the three comments to say "Auth-provided metadata" instead, preserving the same caution without containing the literal flagged substring.
- **Files modified:** `src/middleware.ts`, `src/app/(farmer)/layout.tsx`, `src/app/(owner)/layout.tsx`
- **Verification:** `grep -n "user_metadata" src/middleware.ts "src/app/(farmer)/layout.tsx" "src/app/(owner)/layout.tsx"` returns no matches.
- **Committed in:** `62a5f94` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking build failure, 1 missing critical functionality, 1 bug against literal acceptance criteria)
**Impact on plan:** All three were necessary to make Task 3's own stated redirect targets and acceptance criteria actually true on disk; no scope creep beyond what the plan's own text already required.

## Issues Encountered

- vitest was not previously installed in this project (Plan 01-01 set up the app scaffold but no test runner). Confirmed the package name/version against the live npm registry before installing, per the package-install safety rule — not a guessed or substituted dependency.
- Next.js route groups stripping parentheses from the URL is easy to overlook when two role-scoped groups both want a `dashboard` page at what looks like the same conceptual location — caught immediately by the production build rather than silently shipping a broken route, which is exactly why `npm run build` (not just `tsc --noEmit`) was run as part of this plan's verification even though the plan's `<verify>` block only listed `tsc`.

## User Setup Required

None — no external service configuration required. All necessary Supabase env vars were already present in `.env.local` from Plan 01-01.

## Next Phase Readiness

- Auth + role boundary is fully wired and committed: a user can sign up choosing farmer/owner via the single-form radio control, log in, have their session persist via the existing middleware refresh, log out from either role layout, and be redirected away from the wrong role's routes.
- `/farmer/dashboard` and `/owner/dashboard` exist as placeholder pages — Plan 01-03 (listing service) and later booking/dashboard plans will replace their content, not their routes.
- Manual end-to-end verification (actual signup producing a `public.users` row with the correct role, browser-refresh session persistence, live role-redirect test) was not run in this autonomous, non-checkpoint plan — automated verification (`tsc`, `vitest`, `npm run build`) all pass. This should be exercised once a dev server is running against the live Supabase project, ideally folded into Plan 01-03's or the phase-end verification pass.
- STATE.md and ROADMAP.md will be updated next via `state advance-plan` (Plan 3 of 5) and `roadmap update-plan-progress`.

---
*Phase: 01-walking-skeleton*
*Completed: 2026-06-26*

## Self-Check: PASSED

All claimed files verified present on disk; all claimed commit hashes (`a279ee9`, `29152c6`, `819931f`, `23d268d`, `62a5f94`) verified present in `git log --oneline --all`.
