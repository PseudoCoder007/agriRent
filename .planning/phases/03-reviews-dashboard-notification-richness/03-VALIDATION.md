---
phase: 03
slug: reviews-dashboard-notification-richness
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-27
---

# Phase 03 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest already available in the repo |
| Quick run command | `npx tsc --noEmit -p tsconfig.json` |
| Service tests to add | `src/lib/services/review.service.test.ts` |
| UI verification | Manual browser checks for detail page, dashboards, and live notification updates |

## Sampling Rate

- After each task wave, run `npx tsc --noEmit -p tsconfig.json`
- After review-service work, run the new Vitest file
- Before sign-off, manually verify the complete farmer/owner path end to end

## Per-Task Verification Map

| Requirement | Threat | Secure Behavior | Test Type |
|-------------|--------|-----------------|-----------|
| REVIEW-01 | Farmer reviews a non-completed booking | Service rejects if the booking is not completed or not owned by the caller | unit + manual |
| REVIEW-01 | Duplicate review submission | Unique booking guard prevents a second review for the same booking | unit + typecheck |
| REVIEW-02 | Review data missing from equipment detail page | Detail page shows average rating and review list when reviews exist | manual |
| DASH enrichment | Dashboard only shows raw lists | Dashboard renders summary cards and recent activity from bookings, reviews, notifications | manual |
| NOTIF live updates | Bell does not refresh | Realtime subscription updates unread count without page reload | manual |

## Acceptance Checks

- `npx tsc --noEmit -p tsconfig.json` passes
- Review service tests cover completed-booking gating, duplicate rejection, and happy-path insert/read behavior
- Manual flow confirms live notification updates and unread count changes after mark-read
