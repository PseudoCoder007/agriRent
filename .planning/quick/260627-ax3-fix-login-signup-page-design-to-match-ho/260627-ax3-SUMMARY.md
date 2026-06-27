---
phase: quick-260627-ax3
plan: 01
subsystem: auth
tags: [nextjs, react-hook-form, zod, supabase-auth, sonner, lucide-react, tailwindcss]

# Dependency graph
requires:
  - phase: 01-walking-skeleton (Plan 01-02)
    provides: loginSchema/signupSchema, logIn()/signUp() services, auth.actions.ts {success, message, data} convention
provides:
  - PasswordInput reusable component with eye/eye-off visibility toggle
  - Login/signup pages restyled to match home page visual language
  - Full forgot-password -> email link -> reset-password -> login recovery loop
  - requestPasswordReset()/updatePassword() service functions with anti-enumeration guarantees
  - Dedicated /auth/reset-callback route separate from the email-confirmation /auth/callback route
affects: [auth, ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Password visibility toggle via a forwardRef wrapper component (PasswordInput) around the existing Shadcn Input, keeping react-hook-form FormField/FormControl compatibility"
    - "Anti-enumeration responses: password-reset request always returns the same generic success message regardless of whether the email exists, mirroring logIn()'s existing pattern"
    - "Dedicated recovery callback route (/auth/reset-callback) kept separate from the email-confirmation callback route (/auth/callback) since their post-exchange redirect targets differ"

key-files:
  created:
    - src/components/ui/password-input.tsx
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/(auth)/reset-password/page.tsx
    - src/app/auth/reset-callback/route.ts
  modified:
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/signup/page.tsx
    - src/lib/validations/auth.schema.ts
    - src/lib/services/auth.service.ts
    - src/lib/services/auth.service.test.ts
    - src/app/actions/auth.actions.ts

key-decisions:
  - "requestPasswordReset() always returns the generic anti-enumeration success message except for rate-limit errors, which get their own distinct message (mirrors signUp()'s over_email_send_rate_limit handling)"
  - "updatePassword() relies on the session set by /auth/reset-callback's code exchange rather than a client-supplied user id, so a user cannot target another account's password"
  - "Kept /auth/reset-callback as a new route instead of reusing /auth/callback, since the latter is hardcoded to redirect into role dashboards which is wrong for the recovery flow"

patterns-established:
  - "PasswordInput: drop-in replacement for `<Input type=\"password\">` wherever a visibility toggle is desired, forwards ref for react-hook-form compatibility"

requirements-completed: []

# Metrics
duration: 24min
completed: 2026-06-27
---

# Quick Task 260627-ax3: Login/Signup Redesign + Password Reset Flow Summary

**Restyled login/signup pages to match the home page's gradient/card language, added a PasswordInput eye-toggle component, and built a full forgot-password -> email -> reset-password -> login recovery loop with anti-enumeration guarantees on the new service functions.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-06-27T02:12:00Z
- **Completed:** 2026-06-27T02:36:03Z
- **Tasks:** 3 completed (Task 2 followed TDD RED->GREEN)
- **Files modified:** 10 (4 created, 6 modified)

## Accomplishments

- `PasswordInput` component: wraps the existing Shadcn `Input`, toggles `type="password"`/`type="text"` via an `Eye`/`EyeOff` icon button, fully keyboard-accessible and react-hook-form compatible
- Login and signup pages now share the home page's gradient background, translucent `rounded-3xl` card, slate/emerald palette, and pill-shaped primary button
- `requestPasswordReset()` and `updatePassword()` added to `auth.service.ts`, both following the existing `ServiceResult<T>` pattern and never leaking raw Supabase error text or email-existence information to the client
- New `/forgot-password` and `/reset-password` pages, plus a dedicated `/auth/reset-callback` route that exchanges the Supabase recovery code for a session and redirects to `/reset-password`
- Login page now has a working "Forgot password?" link

## Task Commits

Each task was committed atomically:

1. **Task 1: PasswordInput + login/signup restyle** - `ce401e0` (feat)
2. **Task 2 (RED): failing tests for requestPasswordReset/updatePassword** - `a5b481b` (test)
2. **Task 2 (GREEN): requestPasswordReset/updatePassword service + actions** - `f9137f6` (feat)
3. **Task 3: forgot-password/reset-password pages + recovery callback route** - `aa1ce7f` (feat)

_Note: Task 2 used TDD — RED commit (`a5b481b`) precedes GREEN commit (`f9137f6`), confirmed via `git log`._

## Files Created/Modified

- `src/components/ui/password-input.tsx` - Reusable password input with eye/eye-off visibility toggle, forwards ref for react-hook-form
- `src/app/(auth)/login/page.tsx` - Restyled to home-page visual language; added PasswordInput; added "Forgot password?" link to `/forgot-password`
- `src/app/(auth)/signup/page.tsx` - Restyled to home-page visual language; added PasswordInput
- `src/lib/validations/auth.schema.ts` - Added `forgotPasswordSchema` (`email`) and `resetPasswordSchema` (`password`, min 8)
- `src/lib/services/auth.service.ts` - Added `requestPasswordReset()` and `updatePassword()`, plus a `getSiteUrl()` helper for the recovery redirect URL
- `src/lib/services/auth.service.test.ts` - Added RED->GREEN test coverage for both new service functions (anti-enumeration, rate-limit, generic-failure-message branches)
- `src/app/actions/auth.actions.ts` - Added `requestPasswordResetAction()` and `updatePasswordAction()` following the existing `safeParse` + delegate pattern
- `src/app/(auth)/forgot-password/page.tsx` (new) - Email-only request-reset form, shows result message via toast + inline text
- `src/app/(auth)/reset-password/page.tsx` (new) - PasswordInput-based new-password form, redirects to `/login` on success
- `src/app/auth/reset-callback/route.ts` (new) - Exchanges the recovery `code` for a session, redirects to `/reset-password` (or `/forgot-password?expired=true` on failure)

## Decisions Made

- `requestPasswordReset()` mirrors `logIn()`'s anti-enumeration pattern: always the same generic success message, with a single carved-out exception for rate-limit errors (own distinct message, consistent with `signUp()`'s existing `over_email_send_rate_limit` handling).
- Site URL resolution order for the recovery redirect: `NEXT_PUBLIC_SITE_URL` -> `https://${NEXT_PUBLIC_VERCEL_URL}` -> `http://localhost:3000`.
- `/auth/reset-callback` is a new, separate route rather than extending `/auth/callback`, because the existing callback route's post-exchange behavior (redirect into a role dashboard) is specific to email-confirmation and would be wrong for password recovery.
- `updatePasswordAction` does not call `redirect()` server-side; the reset-password page handles the post-success toast + client-side `router.push("/login")`, since the plan explicitly calls for UI feedback before navigating away.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None for code-level functionality. Note for later manual verification (per the plan's own `<verification>` item 5): the Supabase project's Auth dashboard "Redirect URLs" allow-list must include `<site-url>/auth/reset-callback` for the recovery email link to work in a real environment — this is dashboard configuration, not a code change, and was not performed as part of this quick task (no live Supabase project access in this session).

## Next Phase Readiness

- `npx tsc --noEmit` passes with zero errors across the full project.
- `npx vitest run` passes: 28/28 tests across 6 test files, including 5 new tests for `requestPasswordReset`/`updatePassword`.
- TDD gate compliance confirmed: `test(quick-260627-ax3): add failing tests...` (`a5b481b`) precedes `feat(quick-260627-ax3): implement requestPasswordReset/updatePassword...` (`f9137f6`) in `git log`.
- Manual visual/UAT verification (gradient/card match, eye-icon toggle behavior, full email-link recovery loop against a real Supabase project) is still recommended before considering this user-facing, consistent with the plan's `<verification>` section items 3-5, which require a running dev server and/or a real email inbox.

## Self-Check: PASSED

All 10 listed files verified present on disk; all 4 task commit hashes (`ce401e0`, `a5b481b`, `f9137f6`, `aa1ce7f`) verified present in `git log`.

---
*Quick task: 260627-ax3*
*Completed: 2026-06-27*
