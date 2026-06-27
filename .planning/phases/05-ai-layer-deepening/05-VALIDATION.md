---
phase: 05
slug: ai-layer-deepening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-27
---

# Phase 05 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Existing repo tools plus targeted manual AI checks |
| Quick run command | `npx tsc --noEmit -p tsconfig.json` |
| AI checks | Manual recommendation and tool-calling validation |

## Sampling Rate

- Run typecheck after each AI wave
- Manually verify model responses and tool-call boundaries

## Per-Task Verification Map

| Area | Threat | Secure Behavior | Test Type |
|------|--------|-----------------|-----------|
| Recommendations | Hallucinated marketplace data | AI output is grounded in service-layer data | manual |
| Tool-calling | Unauthorized write path | AI can only invoke safe, validated read-oriented helpers | manual |
| UX | Misleading recommendations | Recommendations remain clearly advisory | manual |

## Acceptance Checks

- `npx tsc --noEmit -p tsconfig.json` passes
- AI never writes directly to core tables
- Recommendation output is explainable and tied to real app data
