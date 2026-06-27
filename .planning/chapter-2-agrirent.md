CHAPTER 2
SYSTEM ANALYSIS

2.1 Existing System

The existing process of agricultural equipment rental in many local settings is typically informal and distributed across phone calls, personal contacts, and direct negotiation between farmers and equipment owners. In such a process, the farmer often depends on manual inquiry to determine whether a machine is available on a particular date, while the owner relies on memory, notes, or isolated communication threads to manage booking requests. This form of operation does not provide a single point of reference for listings, availability, booking status, or notifications.

In the absence of a structured digital platform, equipment discovery is usually limited to local knowledge and word-of-mouth communication. A farmer may contact multiple owners before finding a suitable machine, and the final rental agreement may be confirmed only after several back-and-forth exchanges. Likewise, the owner may receive booking requests through scattered messages without a consistent record of which request has been approved, rejected, or is still pending. The result is a process that is difficult to audit, difficult to scale, and vulnerable to misunderstandings.

AgriRent was developed as a response to this situation. The implemented system provides a centralized web-based marketplace in which owners can publish equipment listings and farmers can search through the available items, inspect details, and request bookings for a selected date range. The project therefore replaces the fragmented rental approach with a single application that stores user data, equipment data, booking data, notifications, and image metadata in a structured Supabase-backed system.

The existing system, as observed through the actual implementation of AgriRent, can be described as a transition from manual coordination to a role-based marketplace model. The project supports two distinct user roles, farmer and equipment owner, and each role has a dedicated navigation path, dashboard view, and allowed set of actions. This is a marked improvement over informal rental arrangements because it gives each actor a clearly defined responsibility within the workflow.

2.2 Limitations of Existing Systems

The current manual or loosely organized method of rental coordination suffers from a number of limitations. These limitations are the practical reasons why a structured system such as AgriRent is required.

| Limitation | Effect |
|------------|--------|
| No centralized listing repository | Farmers must rely on personal contacts or repeated inquiries to discover available equipment. |
| No structured booking workflow | Requests and confirmations can be lost in chat messages or verbal conversations. |
| No role-based access control | Owners and farmers do not operate within clearly separated interfaces and permissions. |
| No consistent status tracking | It is difficult to know whether a request is pending, approved, or rejected. |
| No database-backed record of activity | Historical rental data is hard to preserve or review. |
| Manual pricing coordination | Rental charges may be communicated informally and are prone to inconsistency. |
| No integrated notification mechanism | Users may not be informed promptly when booking decisions change. |
| Limited equipment presentation | Photos, categories, and descriptive details are often missing or stored inconsistently. |

These limitations affect both sides of the marketplace. Farmers experience uncertainty in finding equipment and confirming bookings, while owners face repeated coordination overhead and a lack of organization in managing requests. From a system perspective, manual processes also make it hard to enforce validation rules such as booking date integrity, owner-only listing creation, or correct role assignment.

AgriRent addresses these limitations through a modern full-stack implementation. The project uses a dedicated database schema for users, equipment, images, bookings, and notifications. It also uses server-side actions and service-layer logic so that price computation, ownership checks, and booking status transitions are not left to the client side. In addition, the application uses row-level security and route guards to reduce unauthorized access across user roles.

2.3 Proposed System

The proposed system in this project is the implemented AgriRent web application itself. It is a farm equipment rental marketplace designed to provide a simple, role-based workflow for farmers and equipment owners. The system is intended to support the full path from registration and login to equipment listing, booking request, booking decision, and notification delivery.

The core characteristics of the proposed system are as follows:

- Centralized marketplace: Equipment listings are stored in the system and presented to farmers in a unified browse interface.
- Role-based access: Users are assigned either the farmer role or the owner role at signup, and the application routes them accordingly.
- Equipment listing management: Owners can create equipment entries with title, description, category, rate, rate unit, location, and image.
- Booking request workflow: Farmers can request a rental for a chosen date range from the equipment detail page.
- Server-side business rules: Booking totals are computed on the server using stored equipment rates, not submitted by the client.
- Conflict protection: The booking table uses a database-level exclusion constraint to prevent overlapping active bookings for the same equipment.
- Notification support: Booking-related events generate notifications for the affected party.
- Dashboard visibility: Farmers and owners each have a dashboard that summarizes the most relevant records for their role.
- Chat assistant: A simple FAQ assistant is available through a dedicated chat route.

The system follows a layered implementation approach. The user interface is built with Next.js App Router and shadcn/ui components. Server Actions receive form submissions and delegate to service functions. Service functions interact with Supabase clients and encapsulate the business logic. The database acts as the source of truth for identity, listings, bookings, images, and notifications.

This design improves reliability by ensuring that important actions are validated on the server. For example, a booking request is not accepted simply because the browser submits a form; it is first validated against a strict schema, then checked against the current equipment record, then written to the database with a computed total, and finally protected by an exclusion constraint that blocks overlapping active bookings. Similarly, equipment creation is available only to authenticated owner accounts, and notification inserts that cross user boundaries are handled through a service-role path rather than through client-side access.

2.4 Feasibility Study

2.4.1 Technical Feasibility

The project is technically feasible because it is built on widely used and well-supported web technologies. Next.js 15 provides the application framework, routing, server-side rendering, and server action support. TypeScript improves type safety throughout the codebase. Supabase supplies authentication, PostgreSQL storage, file storage, and row-level security. The application uses standard browser-based forms, role-aware layouts, and conventional service-layer patterns, which makes the implementation manageable and maintainable.

The technical design is also feasible because the implemented features are aligned with the strengths of the chosen stack. The farmer and owner dashboards are rendered as server components, which reduces unnecessary client-side complexity. Multipart form submissions are used where file uploads are required. The chat feature is isolated behind a dedicated API route, and the OpenAI-compatible client is used only on the server. These choices keep the runtime boundaries clear and reduce the chance of exposing sensitive credentials to the browser.

At the database level, the schema is also technically appropriate. The tables are normalized enough for the current scope, relationships are explicit through foreign keys, and the booking overlap problem is handled through a native PostgreSQL exclusion constraint. This is a strong technical choice because the database becomes the authoritative gatekeeper for booking integrity rather than relying on fragile application-side checks alone.

2.4.2 Economic Feasibility

The project is economically feasible because the implemented stack is based largely on open-source or low-cost tools. Next.js, React, TypeScript, PostgreSQL, and Tailwind CSS are open technologies. Supabase provides a managed backend that reduces the cost and complexity of self-hosting authentication and database infrastructure. For a small to medium-scale project, this significantly lowers the operational burden compared with building and maintaining a custom backend stack from scratch.

The application also avoids unnecessary infrastructure. It does not require a separate message broker, a background job runner, or a persistent websocket server for its current feature set. Notifications are stored in the database and shown in the dashboards. The chat assistant is handled through a single route handler and a server-only API client. Because the project is scoped to the implemented marketplace workflow, the cost of development and deployment remains proportionate to the functionality delivered.

From a maintenance perspective, the separation into service functions and server actions reduces long-term cost by making the application easier to extend and debug. A structured codebase also reduces the risk of defects that could otherwise lead to expensive rework. Therefore, the system is economically reasonable for a final-year project and also realistic as a portfolio-grade demonstration.

2.4.3 Operational Feasibility

The system is operationally feasible because the user interactions are straightforward and aligned with typical web usage patterns. A user only needs a modern browser to access the platform. Registration, login, browsing, listing creation, booking requests, and dashboard review all occur through standard form-based interfaces. This reduces the training burden for users and makes the system accessible to non-technical participants.

The farmer workflow is simple: browse equipment, open a detail page, select a date range, and submit a booking request. The owner workflow is equally direct: create listings, review pending bookings, and approve or reject them. Notifications provide visible feedback after booking actions, which helps keep both parties informed without requiring a separate communication channel inside the application.

Operationally, the application is also easier to manage because the backend logic is centralized. Role checks are enforced in middleware and route layouts, while the database provides row-level security and key integrity constraints. This means the system can operate reliably with less manual supervision once deployed. The current scope does not include complex operational dependencies such as background workers or live delivery systems, which keeps day-to-day operation practical.

2.5 Technology Stack

The technology stack for AgriRent has been selected to support a full-stack rental marketplace with strong server-side control and a maintainable implementation structure.

| Technology Category | Technology | Purpose |
|--------------------|------------|---------|
| Frontend Framework | Next.js 15 | Provides routing, layouts, server components, server actions, and route handlers. |
| UI Library | React 19 | Builds the interactive user interface. |
| Language | TypeScript | Adds static typing and improves maintainability. |
| Styling | Tailwind CSS 4 | Provides utility-first styling across the application. |
| Component System | shadcn/ui | Supplies reusable UI primitives such as cards, buttons, forms, calendars, and dialogs. |
| Validation | Zod | Validates auth, equipment, and booking inputs. |
| Form Handling | react-hook-form | Manages form state in client components. |
| Date Utilities | date-fns | Supports date formatting and date-range duration calculation. |
| Notifications | sonner | Displays toast messages after user actions. |
| Backend Platform | Supabase | Provides authentication, Postgres, storage, RLS, and server/client SDK support. |
| Database | PostgreSQL | Stores users, equipment, images, bookings, and notifications. |
| Storage | Supabase Storage | Stores uploaded equipment photos. |
| AI Client | OpenAI SDK | Connects the chat route to NVIDIA NIM through an OpenAI-compatible API. |
| Testing | Vitest | Tests validation schemas and selected service logic. |

The implemented stack reflects the actual project requirements. Since the system is a marketplace with authenticated users, role-based access, file uploads, and database-backed booking integrity, a managed backend platform such as Supabase is suitable. The stack also supports the app router model in Next.js, which fits the server-rendered dashboards and server action patterns already used in the codebase.

The technology choices are also consistent with the current implementation constraints. The application does not rely on a heavy client-state library, real-time websocket infrastructure, or multiple external services for its core features. Instead, it uses a compact but capable stack that matches the project scope and keeps the architecture understandable.

