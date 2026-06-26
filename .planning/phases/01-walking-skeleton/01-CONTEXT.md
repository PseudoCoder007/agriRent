# Phase 1: Walking Skeleton - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a thin, fully-wired walking skeleton: one farmer account and one owner account can sign up, the owner can create one equipment listing, the farmer can browse it and request a booking with a server-computed price and DB-enforced no-double-booking guarantee, the owner can approve/reject, both see status on their dashboard, a plain-list notification fires on status changes, and either user can ask an AI FAQ chatbot a question via NVIDIA NIM. See `.planning/SKELETON.md` for the full required build order and infrastructure guards — this CONTEXT.md only adds the UX/structure decisions discussed below; it does not relitigate SKELETON.md's technical sequencing.

</domain>

<decisions>
## Implementation Decisions

### Signup / Role Flow
- **D-01:** Single `/signup` route with one form; role (farmer/owner) is chosen via a radio/segmented control within that form — not two separate signup pages.
- **D-02:** Role is fixed for the lifetime of the account once chosen at signup. No role-switching UI, ever, in this phase or later — this is a permanent decision, not a Phase-1-only simplification.

### Equipment Categories
- **D-03:** Category is a fixed dropdown, not free text: `Tractor`, `Harvester`, `Plough`, `Rotavator`, `Sprayer`, `Other`. This enum is the source of truth for Phase 2's category filter (EQUIP-05) — do not change it without updating both phases.

### AI Chatbot Placement
- **D-04:** AI FAQ chatbot lives on a dedicated `/chat` route in Phase 1 — not a floating widget. (See Deferred Ideas: floating widget is an explicit future-phase item, not forgotten scope.)

### Dashboard Structure
- **D-05:** Separate dashboard routes per role: `/owner/dashboard` and `/farmer/dashboard` — not one unified dashboard with conditional rendering. Matches the `(farmer)`/`(owner)` route-group structure already specified in SKELETON.md.
- **D-06:** The Phase 1 notification list (plain list, no Realtime) is embedded directly inside each role's dashboard page — not a separate `/notifications` route.

### Claude's Discretion
- Exact visual layout/styling of the dashboard, signup form, and chat page — Phase 1 is functional, not polished (Phase 4 handles visual design). Build with default Shadcn components, no custom styling pass.
- Exact wording of AI chatbot system prompt / FAQ content — implementation detail, not a user-facing decision point.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 build order, schema, and guardrails
- `.planning/SKELETON.md` — the authoritative walking-skeleton slice definition, required build order, and non-negotiable infrastructure guards (RLS recursion avoidance, EXCLUDE constraint, server-computed pricing, pooled connections, AI error handling)

### Project-level stack, architecture, and risk research
- `.planning/research/STACK.md` — validated tech stack, versions, install commands, what NOT to use
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow, Server Actions vs Route Handlers split, walking-skeleton build order
- `.planning/research/PITFALLS.md` — domain pitfalls (RLS recursion, booking race conditions, price tampering, Vercel Hobby limits, NVIDIA NIM rate limits) mapped to Phase 1 done-criteria
- `.planning/research/FEATURES.md` — table-stakes vs differentiator feature validation

### Project scope and requirements
- `.planning/PROJECT.md` — core value, constraints, key decisions (Vertical MVP, AI provider, secrets handling)
- `.planning/REQUIREMENTS.md` — v1/v2/v3 requirement tiers with REQ-IDs; Phase 1 covers AUTH-01/02/03, EQUIP-01/04/06, BOOK-01/02/03/04/05(partial)/06, DASH-01/02, NOTIF-01, AI-01/02
- `CLAUDE.md` — project conventions (folder rules, naming, error-response shape, code-quality limits)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — this is a greenfield project with no source code written. Phase 1 is the first code written in this repository.

### Established Patterns
- None yet — CLAUDE.md's Conventions section defines the patterns to establish (Server Components first, service-layer DB access, Zod validation, `{success, message, data}` API shape) but no code exists to point to as a precedent.

### Integration Points
- N/A for this phase — there is nothing existing to integrate with. Phase 1 establishes the integration points (auth boundary, listing service, booking service, notification writes, AI route handler) that later phases will build on.

</code_context>

<specifics>
## Specific Ideas

- Equipment categories must be exactly: Tractor, Harvester, Plough, Rotavator, Sprayer, Other (no more, no fewer, for v1).
- AI chatbot starts as a dedicated page; a floating/persistent widget version is wanted later, once the dedicated-page version is proven working (see Deferred Ideas).

</specifics>

<deferred>
## Deferred Ideas

- **Floating AI chatbot widget** (available on every page, not just `/chat`) — user explicitly wants this *after* the dedicated-page version works. Natural fit for Phase 4 (UI/Design Polish) or as an AI-deepening item alongside AI-03/AI-04 in v2.
- **Dedicated `/notifications` page** — considered, but Phase 1 embeds notifications in the dashboard instead. Could resurface in Phase 3 (Reviews & Dashboard/Notification Richness) when notifications move to live Realtime updates — worth reconsidering a dedicated page at that point if the dashboard feels crowded.

### Reviewed Todos (not folded)
None — no existing todos matched this phase.

</deferred>

---

*Phase: 01-walking-skeleton*
*Context gathered: 2026-06-26*
