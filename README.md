# AgriRent

AgriRent is a farm equipment rental marketplace built with Next.js, Supabase, and NVIDIA NIM.

Live app: [https://agrirent.shop](https://agrirent.shop)

## What the platform does

- Farmers can sign up, log in, browse equipment, open details, and request bookings.
- Owners can sign up, log in, create equipment listings, and approve or reject booking requests.
- The app stores users, listings, bookings, and notifications in Supabase.
- AgriRent sends branded transactional emails through Resend for welcome, sign-in, password reset, booking, and review events.
- The chat assistant answers rental FAQ questions through NVIDIA NIM.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase Auth, Postgres, Storage, and Row Level Security
- Tailwind CSS 4
- Shadcn UI
- Zod
- React Hook Form
- `date-fns`
- NVIDIA NIM via the `openai` client

## Project Structure

- `src/app/` - routes, layouts, and server actions
- `src/components/` - reusable UI components
- `src/lib/` - Supabase clients, services, validations, and helpers
- `supabase/migrations/` - database schema and RLS migrations
- `types/database.ts` - generated database types

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- An NVIDIA API key for chat
- A Resend account for transactional email

## Environment Variables

Create a `.env.local` file in the project root and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="AgriRent <noreply@agrirent.shop>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NVIDIA_API_KEY=your_nvidia_api_key
```

## How to Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app:

```text
http://localhost:3000
```

## Basic Commands

```bash
npm run dev
npm run build
npm run lint
```

## How to Test AgriRent Properly

Use this sequence for Phase 1 testing. This is the full walking-skeleton flow.

### 1. Home page

- Open `http://localhost:3000`
- Confirm you see the AgriRent landing page
- Click `Create account` or `Log in`

### 2. Create two accounts

- Create one `farmer` account on `/signup`
- Create one `owner` account on `/signup`
- Confirm each account uses the role you selected during signup
- Log in with each account once to confirm the credentials work

### 3. Session persistence

- Log in as farmer
- Refresh the browser
- Confirm the session stays active
- Log out
- Log in as owner
- Refresh the browser
- Confirm the session stays active
- Log out

### 4. Owner creates equipment

- Log in as the owner
- Go to the owner equipment creation page
- Create one listing with:
  - title
  - description
  - category
  - hourly or daily rate
  - at least one image file
- Use a real image under 5 MB
- Confirm the listing saves successfully

### 5. Farmer browses equipment

- Log in as the farmer
- Open `/browse`
- Confirm the owner’s listing appears
- Open the listing detail page
- Confirm the photo, title, description, owner name, and rate are visible

### 6. Booking flow

- On the detail page, request a booking for a date range
- Confirm the booking is created successfully
- Try submitting overlapping booking dates again
- Confirm the second request is rejected with the friendly unavailable-dates message
- Confirm the stored price is computed by the server, not the client

### 7. Owner booking decision

- Open `/owner/dashboard`
- Find the pending request
- Approve it or reject it
- Try actioning the same booking again
- Confirm the second action is blocked

### 8. Notifications

- Check both dashboards after booking create/approve/reject actions
- Confirm notification rows appear as a plain list

### 9. AI chat

- Open `/farmer/chat` or `/owner/chat`
- Ask a question like:

```text
How does booking approval work?
```

- Confirm a real streamed response appears
- Confirm it is not the fallback error message

## What Not to Expect in Phase 1

Phase 1 does not include:

- equipment edit/delete
- category or location filters
- favorites
- completed/cancelled booking transitions
- realtime notifications
- a bell icon
- AI tool-calling or recommendations
- visual polish pass

## Notes

- `/` is the main landing page.
- `/signup` and `/login` are separate routes by design.
- Role-protected dashboards live under `/farmer/*` and `/owner/*`.
- Auth callback handling is at `/auth/callback`.

## Production Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Deployment

The production site is live at [agrirent.shop](https://agrirent.shop).

If you deploy again, make sure the Supabase and NVIDIA environment variables are configured in the hosting platform, and that the Supabase Auth redirect URLs include the production callback route.
