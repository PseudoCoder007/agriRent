# Equipment Listings

**What it does:** Equipment Owners can list machinery for rent with photos, rates, and descriptions. Farmers can browse and view listings.

---

## Prerequisites

- An **Owner** account (signed up with role = Owner)

---

## 1. Owner: Create a Listing

1. Log in as an **Owner**
2. Go to `/owner/dashboard`
3. Click "List Equipment" or navigate to `/equipment/new`
4. Fill in:
   - **Title** (e.g. "John Deere 5050D Tractor")
   - **Description** (optional)
   - **Category** (choose from the dropdown)
   - **Rate** (per hour or per day)
   - **Location** (optional)
   - **Photo** (JPEG, PNG, or WebP under 5 MB)
5. Click "Create listing"
6. **Expected:** The listing appears on your dashboard

## 2. Farmer: Browse Listings

1. Log in as a **Farmer**
2. Go to `/browse`
3. **Expected:** You see all active listings (not deleted) with title, category, rate, and photo

## 3. View Listing Details

1. Click on any listing card
2. **Expected:** You see the full detail page with:
   - Large photo
   - Title, description, category
   - Rate and rate unit
   - Owner name
   - Booking form (date range picker)
   - Favorite button (heart icon)
   - Reviews section (if any exist)

## 4. Filter Listings

1. On `/browse`, use the category dropdown or location search
2. **Expected:** Only matching listings appear

## 5. Owner: Edit a Listing

1. Log in as the **Owner** who created the listing
2. Go to the listing detail page
3. Click "Edit" (visible only to the owner)
4. Change any field and save
5. **Expected:** Changes appear on the listing page

## 6. Owner: Delete a Listing

1. From the edit page, click "Delete listing"
2. Confirm the deletion
3. **Expected:** Listing no longer appears in browse. The owner's dashboard still shows it with a "Deleted" badge.

## Edge Cases

- **No photo upload:** You can create a listing without a photo — it shows a placeholder image
- **Wrong file type:** Uploading a PDF or other non-image file shows an error
- **File too large:** Files over 5 MB are rejected
- **Empty title:** The form won't submit — title is required
