# Phase 4: UI/Design Polish - Pattern Map

**Mapped:** 2026-06-27
**Purpose:** Capture the pages and components that should be restyled once the core flows are functionally complete.

## Current Anchors

- `src/app/page.tsx` - landing page and primary conversion surface.
- `src/app/(auth)/login/page.tsx` and `src/app/(auth)/signup/page.tsx` - auth entry points.
- `src/app/(farmer)/browse/page.tsx`, `src/app/(farmer)/equipment/[id]/page.tsx`, and `src/app/(farmer)/farmer/dashboard/page.tsx` - the main farmer journey.
- `src/app/(owner)/equipment/new/page.tsx`, `src/app/(owner)/equipment/[id]/edit/page.tsx`, and `src/app/(owner)/owner/dashboard/page.tsx` - the owner journey.
- `src/app/(farmer)/farmer/chat/page.tsx` and `src/app/(owner)/owner/chat/page.tsx` - AI/chat surfaces.
- `src/components/ui/*` - the shared shadcn base; reuse these rather than inventing one-off primitives.

## Likely Additions

- Shared layout and section components for page structure, cards, empty states, and hero sections.
- Consistent visual treatment for auth, browse, detail, dashboard, review, and chat pages.
- Responsive refinements for mobile widths and compact dashboard views.
- Loading, error, and empty-state components that match the app's chosen visual language.

## Extension Rules

- Do not change behavior while polishing presentation.
- Prefer composition over rewriting stable page structure.
- Keep the same route model and service-layer boundaries.
