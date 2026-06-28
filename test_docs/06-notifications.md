# Notifications

**What it does:** Keeps users informed about booking activity — requests, approvals, rejections, cancellations, and completions.

---

## Prerequisites

- One **Farmer** and one **Owner** account with at least one booking between them

---

## 1. Receive a Notification

1. As **Farmer**, request a booking
2. Switch to the **Owner** account
3. **Expected:** The bell icon in the header shows an unread count badge

## 2. View Notifications

1. Click the bell icon
2. **Expected:** A list of notifications with messages like:
   - "Farmer X requested to book your Y"
   - "Owner X approved your booking for Y"
   - "Owner X rejected your booking for Y"
   - "Farmer X cancelled their booking for Y"

## 3. Mark Notifications as Read

1. Click "Mark all as read" (or individual notifications)
2. **Expected:** Badge count decreases / disappears

## 4. Realtime Updates

1. Keep the Owner dashboard open in one tab
2. As Farmer in another tab, submit a booking request
3. Switch to the Owner tab
4. **Expected:** The notification appears without refreshing the page (within a few seconds)

## 5. Notifications Per Action

| Action | Notification to Farmer | Notification to Owner |
|--------|----------------------|----------------------|
| Farmer requests booking | — | ✓ |
| Owner approves | ✓ | — |
| Owner rejects | ✓ | — |
| Owner completes | ✓ | — |
| Farmer cancels | — | ✓ |

## Edge Cases

- **No notifications yet:** Bell shows "No new notifications"
- **Multiple unread:** Badge shows the count correctly even with 5+ unread items
