---
slug: owner-deleted-listing-still-visible-after-refresh
status: resolved
created: 2026-06-28T00:00:00Z
updated: 2026-06-28T00:00:00Z
resolved: 2026-06-28T00:00:00Z
phase: 03.3
screenshots:
  - C:/Users/alisa/OneDrive/Pictures/Screenshots/Screenshot 2026-06-28 013933.png
---

## Symptom

An owner deletes a listing, refreshes the dashboard, and the item still appears in "My Equipment".

## Expected

The deleted item should disappear from the owner dashboard after refresh.

## Root Cause

`getEquipmentByOwner()` in `listing.service.ts` was missing the `.is("deleted_at", null)` filter. Unlike `getAllEquipment()` and `getEquipmentById()`, the owner read path returned all rows including soft-deleted ones.

## Fix

Added `.is("deleted_at", null)` to the Supabase query chain in `getEquipmentByOwner()`.

## Verification

- Manually delete a listing, refresh `/owner/dashboard`, confirm item disappears.
- Click a deleted listing's URL directly and confirm 404.

## Tracking

- Fixed in Phase 03.3
- File: `src/lib/services/listing.service.ts:353`

