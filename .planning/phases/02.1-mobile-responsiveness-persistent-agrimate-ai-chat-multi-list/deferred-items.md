# Deferred Items - Phase 02.1

Items discovered during execution that are out of scope for the current task/plan
and were not auto-fixed (per executor Scope Boundary rule).

## src/lib/services/ai.service.test.ts -- 4 pre-existing test failures

**Discovered during:** 02.1-01 Task 3 (`npx vitest run` full-suite pass after chat.service.ts GREEN)

**Symptom:** `getChatCompletion` tests fail with `cookies() was called outside a request
scope` thrown from `src/lib/supabase/server.ts` via `listing.service.ts`'s
`getAllEquipment()` (called from `ai.service.ts`'s `buildSystemPrompt()`).

**Scope:** This file (`ai.service.test.ts`) was created in Phase 01-04 (commit `af005b8`),
long before Phase 02.1 / plan 02.1-01 touched anything. None of plan 02.1-01's files
(`chat.service.ts`, `chat.actions.ts`, `chat.schema.ts`, `chat.service.test.ts`,
`0007_chat_messages.sql`) import or affect `ai.service.ts` or `listing.service.ts`.

**Action:** Not fixed -- out of scope per Scope Boundary rule (pre-existing failure in an
unrelated file, not caused by this plan's changes). Flagging for a future debug/quick task
or the next phase touching `ai.service.ts`.
