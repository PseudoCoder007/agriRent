# Phase 5: AI Layer Deepening - Pattern Map

**Mapped:** 2026-06-27
**Purpose:** Capture the existing AI surface and the service functions that can safely become AI tools later.

## Current Anchors

- `src/app/api/chat/route.ts` - current FAQ chatbot route.
- `src/lib/services/ai.service.ts` - current model integration boundary.
- `src/lib/services/listing.service.ts` - searchable equipment data source.
- `src/lib/services/booking.service.ts` - booking-history and status source for recommendations.
- `src/lib/services/review.service.ts` - review/rating signal source once Phase 3 exists.

## Likely Additions

- AI recommendation/service layer that can summarize or rank equipment using existing marketplace data.
- Optional tool-calling wrappers around existing service functions, rather than raw database access.
- Small UI entry points for recommendations, shortcuts, or AI-assisted discovery.

## Extension Rules

- Keep the AI layer advisory only.
- Prefer calling existing service functions over direct table access.
- Do not let AI bypass RLS or business-rule validation.
