# Full Flow Smoke Test

**What it does:** Walks through the entire application in one go — from account creation to a completed rental. Use this to verify everything works end to end.

---

**Estimated time:** 15 minutes

## Setup

You need two browser windows (or incognito/private sessions):

| Window | Role | Email |
|--------|------|-------|
| Window A | Owner | owner@test.com |
| Window B | Farmer | farmer@test.com |

---

## Step 1 — Create Accounts

**Window A (Owner)**
1. Go to `/signup`
2. Create account with role = **Owner**
3. Verify you land on the Owner dashboard

**Window B (Farmer)**
1. Go to `/signup`
2. Create account with role = **Farmer**
3. Verify you land on the Farmer dashboard

---

## Step 2 — Owner Creates Listing

1. In Window A, go to `/equipment/new`
2. Fill in title, category, rate, upload a photo
3. Submit
4. **Check:** Listing appears on `/owner/dashboard`

---

## Step 3 — Farmer Browses and Favorites

1. In Window B, go to `/browse`
2. **Check:** The owner's listing appears
3. Click the listing to open details
4. **Check:** Photo, title, rate, owner name are visible
5. Click the heart icon to favourite
6. Go to `/farmer/favorites`
7. **Check:** The listing appears in favourites

---

## Step 4 — Farmer Requests Booking

1. Back on the listing detail page, pick future dates
2. **Check:** Total price is displayed (rate × days)
3. Click "Request booking"
4. **Check:** Success message appears

---

## Step 5 — Owner Gets Notification and Approves

1. In Window A (Owner), look at the bell icon
2. **Check:** Unread badge appears (may take a few seconds)
3. Open the notification list and verify the message
4. On `/owner/dashboard`, find the booking
5. Click "Approve"
6. **Check:** Status changes to "approved"

---

## Step 6 — Farmer Sees Approval

1. In Window B, refresh `/farmer/dashboard`
2. **Check:** Booking status is now "approved"
3. **Check:** Notification bell shows unread

---

## Step 7 — Owner Completes

1. In Window A, click "Mark completed" on the booking
2. **Check:** Status changes to "completed"

---

## Step 8 — Farmer Reviews

1. In Window B, on `/farmer/dashboard`, find the completed booking
2. Click "Write a review"
3. Give a rating and optional comment
4. Submit
5. Go back to the equipment detail page
6. **Check:** Your review appears in the Reviews section

---

## Step 9 — AI Chat

1. In either window, go to `/farmer/chat` or `/owner/chat`
2. Ask: "How do I list equipment for rent?"
3. **Check:** A helpful response streams in

---

## Pass Criteria

The test passes if all steps completed without errors. If any step shows a red error or unexpected redirect to the login page, that feature needs attention.

## Troubleshooting

| Symptom | Likely Cause |
|---------|-------------|
| Can't create account | Email already used — try a different one |
| Listing doesn't appear | Refresh the browse page |
| Booking fails with "unavailable" | Dates overlap with another booking — pick different dates |
| AI Chat returns error | NVIDIA API key not configured in `.env.local` |
| Email not received | Check spam folder; Resend might not be configured |
