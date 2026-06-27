# AgriRent Technical Analysis

## 1. Complete Folder Structure

- `src/`
  - `app/`
    - `layout.tsx` - root HTML shell, fonts, toaster.
    - `page.tsx` - current starter homepage.
    - `globals.css` - global styles.
    - `favicon.ico` - app icon.
    - `(auth)/`
      - `login/page.tsx` - login form.
      - `signup/page.tsx` - signup form.
    - `(farmer)/`
      - `layout.tsx` - farmer route guard and header.
      - `browse/page.tsx` - equipment browse list.
      - `equipment/[id]/page.tsx` - equipment detail page.
      - `equipment/[id]/BookingRequestForm.tsx` - booking request UI.
      - `farmer/dashboard/page.tsx` - farmer dashboard.
      - `farmer/chat/page.tsx` - chat page.
    - `(owner)/`
      - `layout.tsx` - owner route guard and header.
      - `equipment/new/page.tsx` - create listing form.
      - `owner/dashboard/page.tsx` - owner dashboard.
      - `owner/dashboard/BookingActionButtons.tsx` - approve/reject buttons.
      - `owner/chat/page.tsx` - owner chat page.
    - `actions/`
      - `auth.actions.ts` - auth server actions.
      - `booking.actions.ts` - booking server actions.
      - `listing.actions.ts` - listing server actions.
    - `api/`
      - `chat/route.ts` - streaming chat API route.
  - `components/`
    - `auth/logout-button.tsx` - sign-out button.
    - `chat/chat-widget.tsx` - client chat UI.
    - `ui/` - shadcn/base UI primitives.
      - `avatar.tsx`
      - `badge.tsx`
      - `button.tsx`
      - `calendar.tsx`
      - `card.tsx`
      - `dialog.tsx`
      - `dropdown-menu.tsx`
      - `form.tsx`
      - `input.tsx`
      - `label.tsx`
      - `radio-group.tsx`
      - `select.tsx`
      - `sonner.tsx`
      - `textarea.tsx`
  - `lib/`
    - `supabase/`
      - `admin.ts` - service-role client.
      - `client.ts` - browser anon client.
      - `server.ts` - server anon client.
    - `services/`
      - `ai.service.ts`
      - `auth.service.ts`
      - `booking.service.ts`
      - `listing.service.ts`
      - `notification.service.ts`
    - `validations/`
      - `auth.schema.ts`
      - `booking.schema.ts`
      - `equipment.schema.ts`
      - matching `*.test.ts` files for each schema.
    - `utils.ts`
  - `middleware.ts` - session refresh and role-based redirects.
- `supabase/`
  - `migrations/`
    - `0001_init_schema.sql`
    - `0002_equipment_images_bucket.sql`
    - `0003_users_public_read.sql`
  - `config.toml` - local Supabase config.
- `types/`
  - `database.ts` - generated Supabase types.
- `public/`
  - default static assets and icons from the starter template.
- `.planning/`
  - `PROJECT.md`
  - `REQUIREMENTS.md`
  - `ROADMAP.md`
  - `SKELETON.md`
  - `STATE.md`
  - `research/`
  - `phases/`
  - `debug/`
- Root config files
  - `package.json`
  - `package-lock.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `eslint.config.mjs`
  - `postcss.config.mjs`
  - `vitest.config.ts`
  - `components.json`
  - `CLAUDE.md`
  - `.env.local`
  - `.env.local.example`
  - `README.md`
  - `agri-.zip`
  - `agri-/` - nested duplicate snapshot of the project tree.

## 2. Tech Stack

- Next.js 15 App Router
  - Full-stack React framework.
  - Uses route groups, Server Components, Server Actions, and a route handler.
- React 19
  - Current UI runtime used by Next 15.
- TypeScript
  - All app code is TypeScript.
  - No `.js` source files are part of the app.
- Tailwind CSS 4
  - Global styling layer.
  - Shadcn is configured against Tailwind variables.
- shadcn/ui
  - Used for reusable UI primitives.
  - Includes `card`, `button`, `form`, `dialog`, `calendar`, `select`, and other components.
- Supabase
  - Postgres database.
  - Auth.
  - Storage.
  - Row Level Security.
  - Server/client/browser SDK wrappers are used through `@supabase/ssr`.
- Zod
  - Used for request and form validation.
  - Shared between client forms and server actions.
- react-hook-form + `@hookform/resolvers`
  - Used for form state and Zod integration.
- date-fns
  - Used for date range math and formatting.
- sonner
  - Used for toast notifications.
- Lucide icons
  - Available through the shadcn/lucide setup.
- OpenAI SDK
  - Used against NVIDIA NIM through an OpenAI-compatible endpoint.
- Vitest
  - Used for schema and service tests.

## 3. Database Tables and Relationships

- `public.users`
  - Stores app profile data mapped one-to-one with `auth.users`.
  - Columns: `id`, `email`, `full_name`, `role`, `created_at`.
  - Role values: `farmer`, `owner`.
  - Relationship: `id` references `auth.users(id)`.
- `public.equipments`
  - Stores equipment listings.
  - Columns: `id`, `owner_id`, `title`, `description`, `category`, `rate`, `rate_unit`, `location`, `created_at`.
  - Relationship: `owner_id` references `public.users(id)`.
- `public.equipment_images`
  - Stores image metadata and storage paths.
  - Columns: `id`, `equipment_id`, `storage_path`, `created_at`.
  - Relationship: `equipment_id` references `public.equipments(id)`.
- `public.bookings`
  - Stores rental requests and booking state.
  - Columns: `id`, `equipment_id`, `farmer_id`, `start_date`, `end_date`, `total_amount`, `status`, `created_at`.
  - Relationships:
    - `equipment_id` references `public.equipments(id)`.
    - `farmer_id` references `public.users(id)`.
  - Booking statuses: `pending`, `approved`, `rejected`, `completed`, `cancelled`.
  - Includes a Postgres exclusion constraint to prevent overlapping `pending`/`approved` bookings for the same equipment.
- `public.notifications`
  - Stores user-facing system notifications.
  - Columns: `id`, `user_id`, `booking_id`, `message`, `read`, `created_at`.
  - Relationships:
    - `user_id` references `public.users(id)`.
    - `booking_id` references `public.bookings(id)`.
- Enums
  - `user_role`: `farmer`, `owner`.
  - `equipment_category`: `Tractor`, `Harvester`, `Plough`, `Rotavator`, `Sprayer`, `Other`.
  - `booking_status`: `pending`, `approved`, `rejected`, `completed`, `cancelled`.
- Database helper functions
  - `current_user_role()`
  - `is_owner()`
  - `owns_equipment(p_equipment_id uuid)`
  - These support RLS without recursive cross-table lookups.

## 4. Authentication Flow

- Signup
  - User submits email, password, full name, and role.
  - `signUpAction` validates input with Zod.
  - `auth.service.signUp` creates the Supabase Auth user.
  - A matching row is inserted into `public.users`.
  - Role is stored in `public.users`, not in auth metadata.
- Login
  - User submits email and password.
  - `logInAction` validates input.
  - `auth.service.logIn` signs in with Supabase Auth.
  - The server reads the role from `public.users`.
  - The user is redirected to the role-specific dashboard.
- Logout
  - `logOutAction` signs the session out.
  - Redirects to `/login`.
- Session refresh
  - `src/middleware.ts` refreshes the Supabase session on each request.
  - This keeps server-rendered pages and actions in sync with cookies.

## 5. User Roles

- Farmer
  - Browses equipment.
  - Opens equipment detail pages.
  - Requests bookings for date ranges.
  - Sees booking history and notifications in the farmer dashboard.
  - Uses chat for general FAQ support.
- Owner
  - Lists equipment.
  - Sees owned equipment on the owner dashboard.
  - Reviews incoming booking requests.
  - Approves or rejects bookings.
  - Receives notifications for booking activity.
  - Uses chat for general FAQ support.
- Admin/system role
  - Not a visible app role.
  - Implemented through the Supabase service-role client.
  - Used for system-generated writes such as notifications.

## 6. Farmer Workflow

- Entry
  - Farmer lands on `/login` or `/signup`.
  - After login, middleware and the farmer layout enforce the `farmer` role.
- Browse
  - Farmer opens `/browse`.
  - The page loads all equipment listings through `listing.service.getAllEquipment()`.
- View details
  - Farmer opens `/equipment/[id]`.
  - Page shows photos, title, category, price, location, owner name, and description.
- Request booking
  - Farmer selects a date range in `BookingRequestForm`.
  - Client shows an estimated total for UX only.
  - Server action computes the actual total and writes the booking.
- Track status
  - Farmer dashboard shows own bookings and statuses.
  - Notifications show booking approval/rejection events.
- Chat
  - Farmer can ask FAQ-style questions through the chat UI.
  - The chat is read-only and does not touch booking or listing data.

## 7. Equipment Owner Workflow

- Entry
  - Owner signs up or logs in.
  - Middleware and owner layout enforce the `owner` role.
- Create listing
  - Owner opens `/owner/equipment/new`.
  - Submits title, description, category, rate, rate unit, optional location, and a photo.
  - Server action validates the form and stores the listing.
- Review dashboard
  - Owner dashboard loads:
    - owned equipment
    - booking requests
    - notifications
- Handle booking requests
  - Pending bookings show Approve and Reject buttons.
  - Button clicks call server actions.
  - The service layer checks ownership and pending status before updating.
- Chat
  - Owner can also access the FAQ chat route.

## 8. Admin Workflow

- No standalone admin UI exists.
- Admin behavior is system-level only.
- The service-role Supabase client is used for notification inserts.
- This bypasses RLS intentionally for trusted backend writes.
- The workflow is narrow and server-only:
  - create notifications on booking request
  - create notifications on approval
  - create notifications on rejection

## 9. Booking Lifecycle

- Request
  - Farmer selects start and end dates.
  - `createBookingAction` validates the payload.
  - `booking.service.createBooking` fetches the equipment rate server-side.
  - `total_amount` is computed server-side.
- Conflict protection
  - The database exclusion constraint blocks overlapping active bookings.
  - The app translates that conflict into a friendly message.
- Initial state
  - New bookings are created as `pending`.
  - Owner receives a notification.
- Review
  - Owner sees the pending booking on the dashboard.
  - Owner may approve or reject.
- Transition
  - Only `pending` bookings can transition.
  - The service checks current status and ownership before update.
  - Approved or rejected bookings trigger notifications to the farmer.
- Later statuses
  - `completed` and `cancelled` are defined in the schema.
  - The current UI and service layer focus on the Phase 1 pending/approved/rejected flow.

## 10. APIs / Server Actions

- Route handler
  - `POST /api/chat`
  - Requires an authenticated session.
  - Accepts a messages array.
  - Streams assistant output back to the client.
- Auth server actions
  - `signUpAction`
  - `logInAction`
  - `logOutAction`
- Listing server actions
  - `createEquipmentAction`
  - Uses multipart `FormData` because it includes an image file.
  - Revalidates `/browse` after a successful create.
- Booking server actions
  - `createBookingAction`
  - `approveBookingAction`
  - `rejectBookingAction`
  - Revalidates farmer and owner dashboards after successful mutations.
- Service layer behavior
  - Server actions are thin wrappers.
  - The business logic lives in `src/lib/services/*`.

## 11. Components Hierarchy

- Root
  - `src/app/layout.tsx`
    - loads fonts
    - mounts `Toaster`
- Auth pages
  - `login/page.tsx`
  - `signup/page.tsx`
  - shared UI primitives from `components/ui`
- Farmer area
  - `src/app/(farmer)/layout.tsx`
    - role guard
    - header
    - `LogoutButton`
  - `browse/page.tsx`
    - `Card`
    - `Badge`
    - `Image`
  - `equipment/[id]/page.tsx`
    - image gallery
    - `Badge`
    - `BookingRequestForm`
  - `BookingRequestForm`
    - `Calendar`
    - `Button`
- Owner area
  - `src/app/(owner)/layout.tsx`
    - role guard
    - header
    - `LogoutButton`
  - `owner/dashboard/page.tsx`
    - lists equipment, bookings, notifications
    - `BookingActionButtons`
  - `BookingActionButtons`
    - `Button`
- Chat
  - `ChatWidget`
    - local message state
    - input field
    - streaming fetch to `/api/chat`
- UI foundation
  - `Button`, `Card`, `Input`, `Form`, `Select`, `Calendar`, `Textarea`, `Badge`, `Dialog`, `DropdownMenu`, `RadioGroup`, `Label`, `Avatar`, `Sonner`

## 12. State Management

- Server state
  - Managed through Supabase and server-side service functions.
  - Pages fetch on the server where possible.
- Form state
  - Managed with `react-hook-form`.
  - Validation handled by Zod resolvers.
- Local UI state
  - Booking form stores selected date range and submit state.
  - Listing form stores selected image and error messages.
  - Chat stores messages, input text, loading state, and error state.
  - Booking action buttons store which action is in flight.
- No global client store
  - There is no Redux/Zustand-style global state layer.
  - The app uses server rendering plus narrow local component state.

## 13. Supabase Usage

- Auth
  - Email/password authentication.
  - Session cookies are handled by `@supabase/ssr`.
- Clients
  - Browser client: anon key, RLS-protected.
  - Server client: anon key, cookie-backed session.
  - Admin client: service role key, server-only.
- Storage
  - Equipment photos are uploaded to a public bucket.
  - Public image URLs are built from the Supabase project URL and storage path.
  - `next.config.ts` allows Supabase storage hosts for `next/image`.
- RLS
  - Enabled on core tables.
  - Policies enforce ownership and self-access.
  - Notification inserts are intentionally restricted to the service-role path.
- Migrations
  - Schema is managed in SQL migrations.
  - Includes the equipment image bucket and a public-read policy migration.
- Generated types
  - `types/database.ts` mirrors the Supabase schema for typed queries.

## 14. Deployment Architecture

- Frontend
  - Designed for Next.js deployment on Vercel.
  - Uses route groups and serverless-friendly server actions.
  - Chat route has an explicit longer max duration than the rest of the app.
- Backend
  - Supabase hosts auth, Postgres, storage, and RLS.
  - No separate custom backend service is present in the repository.
- Runtime boundaries
  - Browser talks to Supabase anon client and Next.js routes.
  - Browser never talks directly to the NVIDIA API.
  - The service-role Supabase key stays server-only.
- Environment variables
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `NVIDIA_API_KEY`
- Image hosting
  - Photos are stored in Supabase Storage.
  - `next/image` is configured for the Supabase public bucket host.
- Operational notes
  - The app uses cookies and middleware for auth continuity.
  - No background worker, queue, or persistent websocket infrastructure is present.

