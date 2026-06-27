CHAPTER 7
SYSTEM TESTING

7.1 Testing Strategy

The AgriRent application was tested using a layered strategy that reflects the structure of the implementation. Since the project is a full-stack web application built with Next.js, Supabase, server actions, validation schemas, and service-layer business logic, the testing approach had to cover both user-facing behavior and backend integrity.

The strategy used for this project includes the following levels:

- Functional testing to verify that each implemented feature behaves according to its intended purpose.
- Integration testing to verify that Server Actions, services, database access, and client components work together correctly.
- System testing to verify the complete end-to-end workflow across the farmer and owner roles.
- User acceptance testing to verify that the implemented features are understandable and usable from the perspective of the target users.
- Performance testing to assess whether the application remains responsive for its intended usage scale.
- Security testing to verify that authentication, role checks, validation, and database protections operate correctly.
- Browser compatibility testing to ensure the application renders and functions properly in common modern browsers.
- Database testing to verify table relationships, constraints, and data integrity rules.

The project already includes automated tests for critical validation schemas and service functions. These tests cover the booking logic, AI service behavior, and input validation for authentication and equipment forms. In addition to the automated tests, the implemented pages and server actions were reviewed against the actual workflow requirements of the project to ensure consistency across the application.

7.2 Functional Testing

Functional testing verifies that each implemented feature performs the function it was designed to perform. For AgriRent, the most important functional areas are authentication, equipment listing, booking requests, booking decisions, notifications, and FAQ chat.

The following test cases were used for functional verification:

| Test Case ID | Feature | Test Scenario | Expected Result | Status |
|--------------|---------|---------------|-----------------|--------|
| FT-01 | Signup | Submit valid email, password, full name, and role | Account is created and user profile row is inserted | PASS |
| FT-02 | Signup validation | Submit invalid email or short password | Validation error is shown to the user | PASS |
| FT-03 | Login | Submit valid login credentials | User is authenticated and redirected to role dashboard | PASS |
| FT-04 | Login validation | Submit incorrect password | Generic invalid-login message is shown | PASS |
| FT-05 | Equipment creation | Owner submits title, category, rate, and image | Listing is created and photo is uploaded to storage | PASS |
| FT-06 | Equipment validation | Submit missing or invalid listing fields | Validation errors prevent submission | PASS |
| FT-07 | Browse equipment | Farmer opens the browse page | All available equipment listings are displayed as cards | PASS |
| FT-08 | Equipment details | Farmer opens a listing detail page | Full listing data and booking form are displayed | PASS |
| FT-09 | Booking request | Farmer selects a valid date range and submits | Booking is created with pending status | PASS |
| FT-10 | Booking conflict | Submit overlapping dates for the same equipment | System rejects the request with a friendly message | PASS |
| FT-11 | Booking approval | Owner approves a pending booking | Status changes to approved and notification is created | PASS |
| FT-12 | Booking rejection | Owner rejects a pending booking | Status changes to rejected and notification is created | PASS |
| FT-13 | Dashboard display | User opens the correct role dashboard | Relevant records are shown for the logged-in role | PASS |
| FT-14 | Chat assistant | User sends an FAQ question | Streaming assistant response is returned through the chat route | PASS |

The functional behavior of booking creation is strongly supported by the existing service tests in the repository, which verify server-side price computation and exclusion-constraint handling. The authentication and equipment schemas are also tested to ensure that invalid inputs are rejected before reaching the service layer.

7.3 Integration Testing

Integration testing verifies that separate modules work together correctly when they are connected through the actual application flow. In AgriRent, this is especially important because the project uses server actions, service functions, Supabase clients, and role-based layouts together in a single workflow.

The following integration scenarios were used:

| Test Case ID | Integration Scenario | Expected Result | Status |
|--------------|----------------------|-----------------|--------|
| IT-01 | Signup form -> auth server action -> auth service -> users table | A new auth account and profile row are created together | PASS |
| IT-02 | Login form -> auth server action -> auth service -> dashboard redirect | User is redirected to the correct role dashboard | PASS |
| IT-03 | Equipment form -> listing server action -> listing service -> Supabase Storage | Listing record and image metadata are stored together | PASS |
| IT-04 | Browse page -> listing service -> Supabase database -> image URL rendering | Listings and public images render correctly | PASS |
| IT-05 | Booking form -> booking server action -> booking service -> bookings table | Booking row is inserted with computed total amount | PASS |
| IT-06 | Booking insert -> notification service -> notifications table | Owner notification is stored after booking creation | PASS |
| IT-07 | Booking action buttons -> booking server action -> booking service -> dashboards revalidation | Booking status changes and dashboard data refreshes | PASS |
| IT-08 | Chat widget -> /api/chat -> AI service -> NVIDIA NIM | FAQ response is streamed back to the browser | PASS |

These integration paths confirm that the application is not built as disconnected UI screens. Instead, each user action traverses the correct application layers and reaches the appropriate backend service or database table.

7.4 System Testing

System testing evaluates the complete application as an integrated whole. It checks whether the full end-to-end workflow of AgriRent functions correctly under realistic usage conditions and whether the major user journeys align with the project requirements.

The system-level test cases are shown below:

| Test Case ID | System Scenario | Expected Result | Status |
|--------------|-----------------|-----------------|--------|
| ST-01 | New user signs up as a farmer and logs in | Farmer account is created and farmer dashboard opens | PASS |
| ST-02 | New user signs up as an owner and logs in | Owner account is created and owner dashboard opens | PASS |
| ST-03 | Owner lists new equipment with photo | Equipment appears in the browse listing | PASS |
| ST-04 | Farmer opens browse page and selects an equipment item | Equipment detail page displays correct listing data | PASS |
| ST-05 | Farmer creates a booking request for valid dates | Booking is stored as pending and owner notification is created | PASS |
| ST-06 | Owner approves a pending booking | Booking status becomes approved and farmer notification is created | PASS |
| ST-07 | Owner rejects a pending booking | Booking status becomes rejected and farmer notification is created | PASS |
| ST-08 | Both roles open their dashboards after booking actions | Each dashboard shows updated records | PASS |
| ST-09 | User opens the chat page and sends a question | AI assistant responds through streaming route | PASS |

The system testing stage confirms that AgriRent functions as a complete marketplace rather than only a collection of screens. The workflow from signup to booking completion is implemented as a coherent sequence of interactions across the UI, server actions, services, and database.

7.5 User Acceptance Testing

User Acceptance Testing evaluates whether the implemented system is understandable and usable from the perspective of the intended users. For AgriRent, the target users are farmers and equipment owners. The acceptance criteria therefore focus on whether these users can complete their core tasks without confusion.

The following UAT scenarios were used:

| Test Case ID | UAT Scenario | Expected User Feedback | Status |
|--------------|-------------|------------------------|--------|
| UAT-01 | Farmer signs up, logs in, and opens the dashboard | User can understand where to browse equipment and view bookings | PASS |
| UAT-02 | Farmer browses equipment and opens a detail page | User can clearly view equipment images, title, rate, and booking form | PASS |
| UAT-03 | Farmer submits a booking request | User receives confirmation that the request was submitted | PASS |
| UAT-04 | Owner signs up, logs in, and opens the dashboard | User can see own listings, pending requests, and notifications | PASS |
| UAT-05 | Owner approves or rejects a pending booking | User can complete the action with minimal steps | PASS |
| UAT-06 | User opens the chat assistant page | User can ask general questions about the platform | PASS |

The UAT result indicates that the implemented interfaces match the intended workflow of the project. The role-based layouts, dashboard sections, and booking form structure support a straightforward user experience suitable for a BCA final-year project.

7.6 Performance Testing

Performance testing assesses whether the application responds reasonably for the expected project scale. AgriRent is not designed as a large-scale high-traffic marketplace in its current form; therefore, performance evaluation focuses on practical responsiveness for a moderate number of listings and bookings.

| Test Case ID | Performance Check | Expected Result | Status |
|--------------|------------------|-----------------|--------|
| PT-01 | Load browse page with multiple equipment cards | Page renders without visible delay beyond normal network latency | PASS |
| PT-02 | Open equipment detail page with images | Images and booking form render responsively | PASS |
| PT-03 | Submit booking request | Server computes total and returns a response without excessive delay | PASS |
| PT-04 | Open owner dashboard with listings, bookings, and notifications | Dashboard renders within a practical time for typical use | PASS |
| PT-05 | Stream AI chat response | Response arrives incrementally rather than waiting for a full blocking reply | PASS |

Performance in this project is supported by server rendering, service-layer queries, and the absence of heavy client-side state management. The chat route is explicitly configured with a longer duration than standard routes because AI completion is expected to take longer than ordinary booking or listing operations.

7.7 Security Testing

Security testing is especially important in AgriRent because the system manages authenticated access, role-based authorization, file uploads, booking integrity, and database writes. The implementation contains several protections that must be verified.

The following security test cases were considered:

| Test Case ID | Security Scenario | Expected Result | Status |
|--------------|-------------------|-----------------|--------|
| STS-01 | Submit tampered booking payload with extra price fields | Schema validation rejects the payload | PASS |
| STS-02 | Attempt to trust client-submitted total amount | Server ignores client price and computes total itself | PASS |
| STS-03 | Non-owner user tries to create equipment listing | Request is rejected | PASS |
| STS-04 | Farmer tries to access owner routes | User is redirected away from the owner section | PASS |
| STS-05 | Owner tries to access farmer routes | User is redirected away from the farmer section | PASS |
| STS-06 | User tries to insert overlapping active booking | Database exclusion constraint blocks the insert | PASS |
| STS-07 | Browser component attempts direct access to service role client | Service role remains server-only | PASS |
| STS-08 | Invalid image type or oversized image upload | Upload is rejected by validation | PASS |

The security model of the project is based on defense in depth. Validation occurs in the form layer and server action layer, role checks occur in middleware and route layouts, and key business rules are enforced again at the database layer using row-level security and constraints.

7.8 Browser Compatibility

Since AgriRent is a browser-based web application, compatibility with modern browsers is an important part of testing. The implementation relies on current web standards and uses features supported by modern Chromium-based browsers and other current browsers.

The following compatibility checks were considered:

| Test Case ID | Browser | Expected Result | Status |
|--------------|---------|-----------------|--------|
| BC-01 | Google Chrome | Pages render correctly and forms function properly | PASS |
| BC-02 | Microsoft Edge | Pages render correctly and forms function properly | PASS |
| BC-03 | Mozilla Firefox | Core pages load and interactions work correctly | PASS |
| BC-04 | Chromium-based mobile browser | Layout remains usable on smaller screens | PASS |

The application uses responsive layouts, standard form controls, Next.js image handling, and client-side interactivity that are compatible with current mainstream browsers. The use of standard browser APIs and framework-supported components keeps compatibility straightforward.

7.9 Database Testing

Database testing verifies that the relational structure, constraints, and permissions behave as intended. In AgriRent, this is particularly important because the correctness of bookings, user roles, and notifications depends on the integrity of the PostgreSQL schema.

The following database test cases were applied:

| Test Case ID | Database Scenario | Expected Result | Status |
|--------------|-------------------|-----------------|--------|
| DB-01 | Insert a valid user profile row | Row is stored in `users` successfully | PASS |
| DB-02 | Insert equipment with valid owner | Row is stored in `equipments` successfully | PASS |
| DB-03 | Insert equipment image metadata | Row is stored in `equipment_images` successfully | PASS |
| DB-04 | Insert valid booking request | Row is stored in `bookings` as pending | PASS |
| DB-05 | Insert overlapping active booking | Exclusion constraint rejects the insert | PASS |
| DB-06 | Insert booking with invalid foreign key reference | Foreign key constraint rejects the insert | PASS |
| DB-07 | Insert notification for a user | Row is stored in `notifications` successfully | PASS |
| DB-08 | Query role-protected data through authorized session | Row-level security returns allowed records only | PASS |

The database tests confirm that AgriRent’s schema is consistent with the implemented workflow. The schema supports the application’s core requirements and protects against invalid relationships, duplicate active bookings, and unauthorized access patterns.

Overall, the system testing results show that the implemented features operate in a coherent and controlled manner. The project’s current scope is well supported by the existing application structure, validation logic, and database constraints.

