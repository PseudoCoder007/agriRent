# Reviews

**What it does:** Farmers can rate and review equipment they've booked and the owner has marked as completed.

---

## Prerequisites

- A **Farmer** account with at least one completed booking

---

## 1. Write a Review

1. Log in as **Farmer**
2. Go to `/farmer/dashboard`
3. Find a completed booking
4. Click "Write a review"
5. Give a **rating** (1–5 stars) and optional comment
6. Submit
7. **Expected:** "Review submitted" message

## 2. Read Reviews

1. Open any equipment detail page (as any role)
2. Scroll to the **Reviews** section
3. **Expected:** You see all reviews with rating, comment, reviewer name, and date

## 3. Average Rating

1. On the listing detail page, check the top of the review section
2. **Expected:** Shows the average rating (e.g. "4.2 out of 5")

## Edge Cases

- **One review per booking:** A farmer can only review each booking once — trying again shows an error
- **No reviews yet:** The review section shows "No reviews yet"
- **Uncompleted booking:** The "Write a review" button only appears for completed bookings
- **Review without comment:** You can submit a rating without writing text
