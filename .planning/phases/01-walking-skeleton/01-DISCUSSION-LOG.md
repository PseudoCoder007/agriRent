# Phase 1: Walking Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-26
**Phase:** 1-walking-skeleton
**Areas discussed:** Signup/role flow, Equipment categories, AI chatbot placement, Dashboard structure

---

## Signup/Role Flow

| Option | Description | Selected |
|--------|-------------|----------|
| One form with toggle | Single /signup route, role picked via radio/segmented control | ✓ |
| Two separate pages | /signup/farmer and /signup/owner as distinct routes | |

**User's choice:** One form with toggle.
**Notes:** Follow-up question asked whether role can change later.

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed forever | Role set once at signup, never changes | ✓ |
| Changeable later | Settings option to switch roles | |

**User's choice:** Fixed forever — simplest RLS model, matches real-world business-role semantics.

---

## Equipment Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed dropdown | Small enum, enables clean Phase 2 filtering | ✓ |
| Free text | Faster now, needs cleanup later | |

**User's choice:** Fixed dropdown.

| Option | Description | Selected |
|--------|-------------|----------|
| Tractor, Harvester, Plough, Rotavator, Sprayer, Other | Common rentable farm machinery types + catch-all | ✓ |
| Let me specify the list | User provides a different set | |

**User's choice:** Tractor, Harvester, Plough, Rotavator, Sprayer, Other.

---

## AI Chatbot Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /chat page | Simplest for Phase 1, proves AI layer end-to-end | ✓ |
| Floating widget everywhere | More polished UX, touches global layout | |

**User's choice:** Dedicated /chat page for now.
**Notes:** User added (free text): "we will start with dedicated page of ai later when it starts working we will work on floating" — floating widget explicitly wanted later, captured as a deferred idea, not dropped scope.

---

## Dashboard Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Separate routes | /owner/dashboard and /farmer/dashboard | ✓ |
| One unified dashboard | Single /dashboard with conditional rendering | |

**User's choice:** Separate routes — matches the (farmer)/(owner) route-group structure already in SKELETON.md.

| Option | Description | Selected |
|--------|-------------|----------|
| Embedded in dashboard | Notifications shown as a section inside each role's dashboard | ✓ |
| Dedicated /notifications page | Separate route | |

**User's choice:** Embedded in dashboard for Phase 1.

---

## Claude's Discretion

- Exact visual layout/styling of dashboard, signup form, and chat page (default Shadcn components, no custom styling — Phase 4 handles polish)
- Exact wording of the AI chatbot's system prompt / FAQ content

## Deferred Ideas

- Floating AI chatbot widget (every page, not just /chat) — explicitly wanted after the dedicated-page version proves out. Candidate for Phase 4 or a v2 AI-deepening item.
- Dedicated /notifications page — reconsider in Phase 3 once notifications move to live Realtime updates.
