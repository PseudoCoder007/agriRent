---
phase: quick-260627-ph2
plan: 01
subsystem: ui
tags: [mobile-nav, sheet-drawer, form-inputs, css-only]
dependency-graph:
  requires: []
  provides:
    - "Spacious, hover-styled mobile nav drawer items (farmer + owner layouts)"
    - "Visible border-slate-300 on login/signup Input and PasswordInput fields"
  affects:
    - "src/app/(farmer)/layout.tsx"
    - "src/app/(owner)/layout.tsx"
    - "src/app/(auth)/login/page.tsx"
    - "src/app/(auth)/signup/page.tsx"
tech-stack:
  added: []
  patterns:
    - "Tailwind className override at call site (cn() merge in PasswordInput/Input) instead of editing base components"
key-files:
  created: []
  modified:
    - "src/app/(farmer)/layout.tsx"
    - "src/app/(owner)/layout.tsx"
    - "src/app/(auth)/login/page.tsx"
    - "src/app/(auth)/signup/page.tsx"
decisions: []
metrics:
  duration: "15min"
  completed: "2026-06-27"
---

# Quick Task 260627-ph2: Fix mobile nav drawer cramped spacing and faint auth input borders Summary

Restyled the mobile nav Sheet drawer's nav links with rounded padding and visible hover background, and added `border-slate-300` to login/signup Input and PasswordInput fields to match the existing visible-border style on the Google OAuth button.

## What Was Built

**Task 1 — Mobile nav drawer restyle** (`src/app/(farmer)/layout.tsx`, `src/app/(owner)/layout.tsx`)

Each `SheetClose`'s inner `Link` className in the mobile drawer (`<nav>` inside `SheetContent`) was changed from the bare `"text-muted-foreground hover:text-foreground"` to:

```
flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground
```

The nav container's `gap-1` was dropped (now just `flex flex-col p-4`) since `py-2.5` padding on each item already creates comfortable, non-double-spaced separation between links. Affected: 4 links in farmer layout (Dashboard, Browse, Favorites, Chat), 2 links in owner layout (Dashboard, Chat). Desktop nav (`hidden gap-3 text-sm sm:flex` block) was left untouched in both files, per scope.

**Task 2 — Visible input borders on auth pages** (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`)

Added `className="border-slate-300"` at the call site to:
- Login: email `Input`, `PasswordInput`
- Signup: full-name `Input`, email `Input`, `PasswordInput`

Confirmed both `Input` and `PasswordInput` forward `className` through `cn()` (tailwind-merge), so the override cleanly replaces the faint default `border-input` token without needing to touch `src/components/ui/input.tsx` or `password-input.tsx`. The `RadioGroupItem`/`Label` role selector on signup was left untouched (unrelated to the bug).

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit -p tsconfig.json` passed cleanly after both tasks (no type errors).
- `src/components/ui/input.tsx`, `src/components/ui/password-input.tsx`, and `globals.css` were not modified, confirmed via `git status` showing no changes to those files.
- Manual visual verification (mobile viewport drawer tap, auth page input borders) was not performed in this session — recommend the user spot-check `/farmer/dashboard` and `/owner/dashboard` mobile drawers, and `/login` / `/signup` input borders, per the plan's `<verification>` section items 2-3.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `09d3503` | fix(quick-260627-ph2): restyle mobile nav drawer items with padding and hover state |
| 2 | `fdcd2a0` | fix(quick-260627-ph2): add visible border to login/signup input fields |

## Self-Check: PASSED

- FOUND: src/app/(farmer)/layout.tsx (modified, contains `rounded-md px-3 py-2.5` and `hover:bg-accent`)
- FOUND: src/app/(owner)/layout.tsx (modified, contains `rounded-md px-3 py-2.5` and `hover:bg-accent`)
- FOUND: src/app/(auth)/login/page.tsx (modified, contains `border-slate-300` x2)
- FOUND: src/app/(auth)/signup/page.tsx (modified, contains `border-slate-300` x3)
- FOUND commit: 09d3503
- FOUND commit: fdcd2a0
