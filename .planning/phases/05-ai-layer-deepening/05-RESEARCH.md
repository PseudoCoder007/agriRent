# Phase 5 Research

## What Already Exists

- The project already has an FAQ-only AI chat route and a stable service boundary for AI calls.
- Marketplace services already expose the structured data that AI recommendations would need.
- Research notes already treat AI recommendations and tool-calling as a later-phase idea once there is real transaction/review history.

## Gaps

- There is no recommendation layer yet.
- There is no tool-calling contract for AI to use marketplace services safely.
- There is no UX for surfacing AI recommendations or AI-assisted discovery.

## Locked Direction

- AI remains advisory, not autonomous.
- Any tool-calling must go through the same service-layer validation used everywhere else.
- The AI layer must not become a raw database backdoor.

## Assumptions

- Recommendation quality depends on booking and review history being present.
- The first version should prioritize safety and explainability over sophistication.
