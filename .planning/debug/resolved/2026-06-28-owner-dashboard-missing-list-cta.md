---
slug: owner-dashboard-missing-persistent-list-equipment-cta
status: resolved
created: 2026-06-28T00:00:00Z
updated: 2026-06-28T00:00:00Z
resolved: 2026-06-28T00:00:00Z
phase: 03.3
screenshots:
  - C:/Users/alisa/OneDrive/Pictures/Screenshots/Screenshot 2026-06-28 013933.png
---

## Symptom

The owner dashboard does not show a clear way to add another equipment listing when the owner already has items.

## Expected

A visible `List equipment` action should always be available from the owner dashboard.

## Root Cause

The "List equipment" CTA only rendered inside the `<EmptyState>` component (when `equipment.length === 0`). Once the owner had any listings, the button disappeared.

## Fix

Moved the CTA to a persistent header row above the "My Equipment" section. Always visible regardless of listing count. Removed the duplicate CTA from the empty state.

## Verification

- Confirm "+ List equipment" button is visible on `/owner/dashboard` with or without existing listings.

## Tracking

- Fixed in Phase 03.3
- File: `src/app/(owner)/owner/dashboard/page.tsx:98-106`

