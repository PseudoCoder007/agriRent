---
slug: auth-pages-black-after-dark-mode-logout
status: resolved
created: 2026-06-28T00:00:00Z
updated: 2026-06-28T00:00:00Z
resolved: 2026-06-28T00:00:00Z
phase: 03.3
screenshots:
  - C:/Users/alisa/OneDrive/Pictures/Screenshots/Screenshot 2026-06-28 014419.png
---

## Symptom

After toggling night mode and logging out, the login/signup pages render dark instead of staying white/light.

## Expected

The auth pages and landing page should stay light/white even if the user previously enabled dark mode.

## Root Cause

`next-themes` persists the `dark` class in localStorage. When the user logs out and the browser navigates to `/login`, the `<html>` element still has `class="dark"`, and `body` inherits the dark `--background` CSS variable. While the `<main>` element has hardcoded light background, CSS custom properties used by shadcn components still resolved to dark values.

## Fix

Added a `.force-light` CSS class in `globals.css` that overrides all relevant CSS custom properties to their light-mode values. Applied this class to the `<main>` element of all 4 auth pages (login, signup, forgot-password, reset-password) and the landing page. Also added `html:has(.force-light)` and `body:has(.force-light)` rules to prevent the dark body background from showing through during page transitions.

## Verification

- Toggle dark mode, log out, confirm login/signup/forgot-password/reset-password/home all render light.

## Tracking

- Fixed in Phase 03.3
- Files: `src/app/globals.css`, `src/app/page.tsx`, `src/app/(auth)/*`

