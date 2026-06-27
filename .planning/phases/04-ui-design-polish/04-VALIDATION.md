---
phase: 04
slug: ui-design-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-27
---

# Phase 04 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Existing repo tools plus manual browser QA |
| Quick run command | `npx tsc --noEmit -p tsconfig.json` |
| Visual QA | Desktop and mobile browser checks |

## Sampling Rate

- Run typecheck after each UI wave
- Review pages in browser after each major polish batch

## Per-Task Verification Map

| Area | Threat | Secure Behavior | Test Type |
|------|--------|-----------------|-----------|
| Auth pages | Visual regressions | Login/signup remain readable and consistent | manual |
| Browse/detail | Layout breakage | Equipment flows remain usable on desktop and mobile | manual |
| Dashboards | Density problems | Summaries and cards remain legible, not cramped | manual |
| Chat | Presentation drift | Chat screens match the same design system | manual |

## Acceptance Checks

- `npx tsc --noEmit -p tsconfig.json` passes
- Mobile and desktop layouts are readable
- Empty, loading, and error states are visually intentional
