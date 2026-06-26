---
status: testing
phase: 01-walking-skeleton
source: [01-VERIFICATION.md]
started: 2026-06-27T00:00:00Z
updated: 2026-06-27T00:00:00Z
---

## Current Test

number: 1
name: Signup -> Login -> Session Persistence -> Logout
expected: |
  Sign up a real farmer account and a real owner account via /signup; confirm a public.users row appears with the correct role for each; log in as each; refresh the browser mid-session; log out from each role's dashboard.
  Both signups succeed and persist a correctly-roled public.users row; refreshing the browser does not log the user out; logout works and redirects to /login.
awaiting: user response

## Tests

### 1. Signup -> Login -> Session Persistence -> Logout
expected: Sign up a real farmer account and a real owner account via /signup; confirm a public.users row appears with the correct role for each; log in as each; refresh the browser mid-session; log out from each role's dashboard. Both signups succeed and persist a correctly-roled public.users row; refreshing the browser does not log the user out; logout works and redirects to /login.
result: [pending]

### 2. Equipment Creation + Photo Upload + Browse/Detail
expected: As the owner account, create one equipment listing with a real JPEG/PNG/WebP photo under 5MB. As the farmer account, browse /browse and open the listing's detail page. The photo appears in Supabase Storage and renders on both the browse card and detail page; owner's name, rate, description all display correctly.
result: [pending]

### 3. Booking Lifecycle: Create, Concurrency, Approve/Reject, Notification
expected: As the farmer, request a booking for a date range on the listed equipment. Attempt a tampered total_amount via a direct fetch/curl call bypassing the form. Fire two near-simultaneous overlapping booking requests for the same equipment. As the owner, approve one pending booking, then attempt to approve/reject it again. Stored total_amount always equals server rate x duration regardless of the tampered value; exactly one of the two concurrent overlapping requests succeeds, the other gets the friendly "dates no longer available" message (not a 500); the second approve/reject attempt on an already-actioned booking is blocked; a notification appears on the relevant dashboard after each transition.
result: [pending]

### 4. AI Chatbot Real Response
expected: Log in as either role, navigate to /farmer/chat or /owner/chat, ask "How does booking approval work?" and confirm a real, on-topic, streamed answer appears (not the fallback "assistant is busy" message). A real NVIDIA NIM (meta/llama-3.1-8b-instruct) response streams token-by-token into the chat UI.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
