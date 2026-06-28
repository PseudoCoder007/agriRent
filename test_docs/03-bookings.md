# Bookings

**What it does:** Farmers can request to rent equipment for a date range. Owners approve or reject requests. Bookings move through a lifecycle: pending → approved/rejected → completed/cancelled.

---

## Prerequisites

- One **Farmer** account and one **Owner** account
- The Owner has at least one active listing

---

## 1. Farmer: Request a Booking

1. Log in as the **Farmer**
2. Find a listing and open its detail page
3. Pick a **start date** and **end date** (future dates — today + 2 to today + 5 works)
4. The **total price** is shown (computed from the rate × number of days)
5. Click "Request booking"
6. **Expected:** "Booking requested successfully" message

## 2. Owner: Approve or Reject

1. Log out as Farmer, log in as **Owner**
2. Go to `/owner/dashboard`
3. Find the pending booking request
4. Click **Approve** or **Reject**
5. **Expected:** Status updates. A notification is created for the farmer.

## 3. Farmer: See Booking Status

1. Log in as **Farmer**
2. Go to `/farmer/dashboard`
3. **Expected:** The booking shows with its current status (pending / approved / rejected / completed / cancelled)

## 4. Farmer: Cancel a Pending Booking

1. On `/farmer/dashboard`, find a booking with status "pending"
2. Click "Cancel"
3. **Expected:** Booking status changes to "cancelled"

## 5. Owner: Mark Booking as Completed

1. Log in as **Owner**
2. On `/owner/dashboard`, find an approved booking
3. Click "Mark completed"
4. **Expected:** Status changes to "completed"

## 6. Double-Booking Prevention

1. As a Farmer, book Equipment A for July 10–July 15
2. Try to book the **same equipment** for July 12–July 18
3. **Expected:** The request fails with "These dates are no longer available"
4. Try a non-overlapping range (e.g. July 20–July 25)
5. **Expected:** Booking succeeds

## 7. Price Integrity

1. Open your browser's Developer Tools (F12 → Network tab)
2. As Farmer, submit a booking and inspect the request payload
3. **Verify:** The request only contains `equipmentId`, `startDate`, `endDate` — no `total_amount` or `status`
4. The server always computes the final price from the stored rate

## Edge Cases

- **Past dates:** The date picker won't let you select today or earlier
- **Booking your own listing:** If a Farmer tries to book their own equipment (not possible — only Owners can create listings, but still guarded)
- **Status transition rules:** Once a booking is "approved", you cannot approve it again. Once "cancelled", it stays cancelled.
- **Same dates already booked:** The system prevents double-booking at the database level — even if two requests arrive at the same time.
