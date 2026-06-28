# Profile

**What it does:** Users can edit their display name, phone number, and profile photo.

---

## Prerequisites

- Any logged-in account (Farmer or Owner)

---

## 1. Edit Name and Phone

1. Go to your profile page (`/farmer/profile` or `/owner/profile`)
2. Change your **full name** and/or **phone number**
3. Click "Save"
4. **Expected:** "Profile updated" message. The new name appears in the header.

## 2. Upload Profile Photo

1. On the profile page, click the avatar or "Upload photo"
2. Select a JPEG, PNG, or WebP image under 5 MB
3. **Expected:** New photo appears immediately. The header avatar updates too.

## 3. Replace Profile Photo

1. Upload a second photo
2. **Expected:** Old photo is replaced — both the profile page and header reflect the change

## Edge Cases

- **Empty name:** Form won't submit — name is required
- **Phone validation:** Only accepts valid phone numbers (min 10 digits)
- **Phone optional:** You can save with an empty phone field
- **+ prefix:** Phone numbers with "+" prefix are accepted
- **Wrong file type:** Non-image files are rejected
- **File too large:** Images over 5 MB are rejected
