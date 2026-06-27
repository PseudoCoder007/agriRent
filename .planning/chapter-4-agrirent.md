CHAPTER 4
MODULES DESCRIPTION

4.1 Authentication Module

The Authentication Module manages user identity, session creation, and role-based access control within AgriRent. It supports user registration, login, logout, and authenticated session continuity across protected pages. The implementation is built on Supabase Auth and is integrated into the application through server actions, server-side Supabase clients, middleware, and role-specific layouts.

During registration, the user provides an email address, password, full name, and role. The signup form validates this data using Zod before submission. The corresponding server action then invokes the authentication service, which creates the Supabase Auth account and inserts a matching row into the `users` table. This row stores the user’s name and role, which are then used throughout the application for authorization and routing. The role is chosen once at signup and is not taken from editable client-side metadata.

During login, the application verifies the email and password using Supabase Auth. After successful authentication, the application retrieves the user’s role from the database and redirects the user to the appropriate dashboard. Farmers are routed to the farmer section, while owners are routed to the owner section. This approach ensures that access decisions are based on server-controlled data rather than on data supplied by the browser.

Session continuity is maintained through middleware and server-side clients. The middleware refreshes the session cookie on each request and checks whether the current path belongs to a protected role group. The farmer and owner layouts perform an additional server-side role check on every render. Logout is provided through a reusable client component that calls the logout server action and redirects the user back to the login page.

The module is implemented through the following files:

- [`src/app/(auth)/login/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(auth)\login\page.tsx)
- [`src/app/(auth)/signup/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(auth)\signup\page.tsx)
- [`src/app/actions/auth.actions.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\actions\auth.actions.ts)
- [`src/lib/services/auth.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\auth.service.ts)
- [`src/lib/validations/auth.schema.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\validations\auth.schema.ts)
- [`src/middleware.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\middleware.ts)
- [`src/app/(farmer)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\layout.tsx)
- [`src/app/(owner)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\layout.tsx)
- [`src/components/auth/logout-button.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\components\auth\logout-button.tsx)

The main database table used by this module is `users`, while Supabase Auth manages the underlying authentication identity.

4.2 Equipment Module

The Equipment Module covers the creation, storage, browsing, and display of agricultural equipment listings. It is one of the core functional modules of the project because the marketplace depends on the ability of owners to publish equipment and of farmers to inspect those listings before making a booking request.

Owners create new equipment through a dedicated form page. The form collects the equipment title, description, category, rate, rate unit, location, and a photo. The user interface uses react-hook-form and Zod for validation, while the final submission is sent as `FormData` to a server action. The server action checks the authenticated session, validates the payload again, and delegates the creation logic to the listing service.

The listing service performs the main business logic. It verifies that the requesting account is an owner, validates the uploaded file type and size, inserts a new row into the `equipments` table, uploads the image to Supabase Storage, and records the image path in the `equipment_images` table. If the upload fails after the listing is created, the service returns a partial-success message so the owner can retry image handling later.

Farmers access equipment through the browse page and the equipment detail page. The browse page retrieves all equipment records and displays them as cards containing the photo, title, category, rate, and owner name. The detail page presents the selected equipment in a fuller layout with multiple images, description, location, and a booking request form. The image URLs are generated from the public Supabase Storage bucket and rendered through Next.js image support.

The module is implemented through the following files:

- [`src/app/(owner)/equipment/new/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\equipment\new\page.tsx)
- [`src/app/actions/listing.actions.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\actions\listing.actions.ts)
- [`src/lib/services/listing.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\listing.service.ts)
- [`src/lib/validations/equipment.schema.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\validations\equipment.schema.ts)
- [`src/app/(farmer)/browse/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\browse\page.tsx)
- [`src/app/(farmer)/equipment/[id]/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\equipment\[id]\page.tsx)
- [`src/app/(farmer)/equipment/[id]/BookingRequestForm.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\equipment\[id]\BookingRequestForm.tsx)
- [`next.config.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\next.config.ts)

The primary database tables used by this module are `equipments` and `equipment_images`. Supabase Storage is used to hold uploaded photographs.

4.3 Booking Module

The Booking Module implements the central rental workflow of the application. It allows a farmer to request equipment for a chosen date range and allows the equipment owner to approve or reject the request. This module also ensures that the booking price and booking validity are controlled by server-side logic rather than by the client interface.

The farmer begins by opening the equipment detail page and selecting a start and end date in the booking request form. The form calculates a display-only estimate for user convenience, but the actual booking amount is computed on the server. When the form is submitted, the booking server action validates the data using a strict Zod schema and passes the request to the booking service.

The booking service fetches the equipment record from the database, reads the stored rate, calculates the total amount using the date range, and inserts the booking as a pending request. The booking table is protected by a database-level exclusion constraint so that overlapping active bookings cannot be inserted for the same equipment. If the database raises a conflict, the service converts it into a friendly message rather than exposing a raw error.

Owners review incoming requests from the owner dashboard. The dashboard separates pending bookings from active ones, and the approve/reject controls are available only for pending requests. The booking service performs additional checks to confirm that the current user owns the equipment and that the booking is still pending before updating the status. After a successful approval or rejection, a notification is created for the farmer.

The module is implemented through the following files:

- [`src/app/(farmer)/equipment/[id]/BookingRequestForm.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\equipment\[id]\BookingRequestForm.tsx)
- [`src/app/actions/booking.actions.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\actions\booking.actions.ts)
- [`src/lib/services/booking.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\booking.service.ts)
- [`src/lib/validations/booking.schema.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\validations\booking.schema.ts)
- [`src/app/(owner)/owner/dashboard/BookingActionButtons.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\owner\dashboard\BookingActionButtons.tsx)
- [`src/app/(farmer)/farmer/dashboard/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\farmer\dashboard\page.tsx)
- [`src/app/(owner)/owner/dashboard/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\owner\dashboard\page.tsx)

The principal database table used by this module is `bookings`, with supporting references to `equipments`, `users`, and `notifications`.

4.4 Dashboard Module

The Dashboard Module provides role-specific views for the two major user groups in the system. Rather than presenting a single generic dashboard, AgriRent uses separate farmer and owner dashboards so that each role sees only the information relevant to its workflow.

The farmer dashboard displays the booking history for the logged-in farmer and shows the current status of each booking using status badges. It also displays the user’s notifications in a simple list. This gives the farmer a clear overview of past and current rental activity without needing to inspect each equipment page individually.

The owner dashboard displays the owner’s equipment listings, incoming booking requests, active bookings, and notifications. This is the main operational screen for the owner role. It allows the owner to monitor the marketplace activity associated with their equipment and to respond to pending booking requests efficiently.

Both dashboards are server-rendered and rely on service-layer calls rather than raw queries in the page components. This keeps the implementation consistent with the project’s architecture rules. The dashboards also include shared layout elements such as the role label and the logout button, which help users remain oriented within the correct role section of the application.

The module is implemented through the following files:

- [`src/app/(farmer)/farmer/dashboard/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\farmer\dashboard\page.tsx)
- [`src/app/(owner)/owner/dashboard/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\owner\dashboard\page.tsx)
- [`src/app/(farmer)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\layout.tsx)
- [`src/app/(owner)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\layout.tsx)
- [`src/app/(owner)/owner/dashboard/BookingActionButtons.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\owner\dashboard\BookingActionButtons.tsx)
- [`src/components/auth/logout-button.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\components\auth\logout-button.tsx)

The dashboard module uses the `equipments`, `bookings`, `notifications`, and `users` tables.

4.5 Admin Module

The Admin Module in AgriRent is not exposed as a separate administrator dashboard. Instead, the project implements a narrow internal admin capability through server-only operations that bypass normal row-level restrictions when necessary. The purpose of this module is to support system-generated actions that do not belong to either the farmer or owner directly.

The clearest example of this behavior is the notification workflow. Notification records are inserted through a service-role Supabase client in a trusted server-side path. This is necessary because the notification recipient is often not the same user who triggered the event. For example, when a farmer submits a booking request, the system creates a notification for the owner. When the owner approves or rejects that booking, the system creates a notification for the farmer. These writes are intentionally performed outside the normal authenticated user boundary.

The project does not implement a separate admin UI, admin login, or admin analytics dashboard. Therefore, the admin module should be understood as a backend system capability rather than a user-facing role in the current application.

The module is implemented through the following files:

- [`src/lib/supabase/admin.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\supabase\admin.ts)
- [`src/lib/services/notification.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\notification.service.ts)
- [`src/lib/services/booking.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\booking.service.ts)

The main table used by this module is `notifications`.

4.6 Search Module

The Search Module is minimal in the current implementation. The project provides equipment browsing, but it does not yet implement advanced search, category filtering, location filtering, or sorting controls. As a result, the present search capability is best described as a browse-based discovery flow rather than a fully featured search engine.

Farmers can view a list of all available equipment on the browse page and open individual equipment detail pages. This gives them a basic discovery mechanism for finding listings, but it does not include user-driven query parameters or filtering inputs. The current implementation therefore supports listing inspection, not advanced search.

Although the application does not yet include a dedicated search interface, the data model already contains fields that would support future search features, such as equipment category, location, title, and description. The current module can therefore be considered an initial browsing foundation for future search enhancement.

The module is implemented through the following files:

- [`src/app/(farmer)/browse/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\browse\page.tsx)
- [`src/lib/services/listing.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\listing.service.ts)
- [`src/app/(farmer)/equipment/[id]/page.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\equipment\[id]\page.tsx)

The tables that support future search behavior are `equipments`, `equipment_images`, and `users`.

4.7 Profile Module

The Profile Module stores and exposes the identity data associated with each account. In AgriRent, profile data is not managed through a dedicated profile-edit screen. Instead, the user profile is created during signup and then reused for role checks, dashboard routing, and display purposes.

The profile record includes the user ID, email address, full name, role, and creation timestamp. The application reads this information from the `users` table whenever it needs to determine whether the current account belongs to a farmer or an owner. This is particularly important for access control in middleware and in the role-specific layouts.

At present, the profile module does not provide a user-facing edit profile page, avatar upload, or preference settings interface. Its implementation is therefore limited to the identity and role data required by the current application workflow. Even though the module is small, it is essential because other parts of the system depend on it for secure routing and correct role assignment.

The module is implemented through the following files:

- [`src/lib/services/auth.service.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\lib\services\auth.service.ts)
- [`src/middleware.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\middleware.ts)
- [`src/app/(farmer)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(farmer)\layout.tsx)
- [`src/app/(owner)/layout.tsx`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\(owner)\layout.tsx)
- [`src/app/actions/auth.actions.ts`](C:\Users\alisa\OneDrive\Desktop\AgriRent\src\app\actions\auth.actions.ts)

The primary table used by this module is `users`.

