CHAPTER 3
SYSTEM DESIGN

3.1 System Architecture

AgriRent follows a layered web application architecture built around the Next.js App Router, Supabase services, and a clear separation between presentation, server logic, and data storage. The browser interacts with role-based pages rendered by Next.js, while Server Actions and service functions manage business operations such as authentication, equipment creation, booking requests, booking approval, and notifications. Supabase provides the database, authentication, and storage layers, and the chat assistant is exposed through a dedicated API route that connects to an OpenAI-compatible NVIDIA NIM endpoint.

The architecture is intentionally designed to keep sensitive operations on the server side. The browser never communicates directly with the database using privileged credentials. Instead, the application uses three Supabase client paths: a browser client for user-facing interactions, a server client for authenticated server-side queries, and a service-role admin client for narrow system-generated writes such as notifications. This structure supports the project’s security goals and makes the booking workflow more reliable.

```mermaid
flowchart TB
  U[User Browser] --> APP[Next.js 15 App Router]

  subgraph Frontend
    APP --> R1[Auth Pages]
    APP --> R2[Farmer Pages]
    APP --> R3[Owner Pages]
    APP --> R4[Chat Pages]
    APP --> UI[shadcn/ui + Tailwind]
  end

  subgraph Server
    A1[Server Actions]
    A2[Route Handler /api/chat]
    S1[Auth Service]
    S2[Listing Service]
    S3[Booking Service]
    S4[Notification Service]
    S5[AI Service]
  end

  subgraph Supabase
    DB[(Postgres)]
    AUTH[Supabase Auth]
    ST[Supabase Storage]
    RLS[RLS Policies]
  end

  subgraph External
    NIM[NVIDIA NIM OpenAI-Compatible API]
  end

  APP --> A1
  APP --> A2

  A1 --> S1
  A1 --> S2
  A1 --> S3

  A2 --> S5
  S5 --> NIM

  S1 --> AUTH
  S2 --> DB
  S3 --> DB
  S4 --> DB
  S2 --> ST

  DB --- RLS
  AUTH --> APP
```

Figure 3.1 shows the overall system architecture of AgriRent. The figure illustrates how the user browser interacts with the Next.js application, how server actions delegate to specialized services, and how Supabase supplies authentication, storage, and PostgreSQL persistence. It also shows the dedicated AI route and the external NVIDIA NIM service used for FAQ chat completion.

3.2 DFD Level 0

The Level 0 data flow diagram represents AgriRent as a single high-level process that receives requests from the main actors and returns corresponding results. At this level, the system is viewed as one integrated platform that manages authentication, listings, bookings, notifications, and chat responses.

```mermaid
flowchart TB
  Farmer[Farmer]
  Owner[Equipment Owner]
  NVIDIA[NVIDIA NIM API]

  P0((AgriRent Platform))

  Farmer -->|signup/login, browse, booking requests, chat| P0
  Owner -->|signup/login, listing, booking decisions, chat| P0
  P0 -->|results, dashboards, messages| Farmer
  P0 -->|results, dashboards, messages| Owner
  P0 -->|chat completion request| NVIDIA
  NVIDIA -->|streamed FAQ response| P0
```

Figure 3.2 presents the DFD Level 0 view. The diagram shows two external actors, farmer and equipment owner, exchanging data with the AgriRent platform. Farmers submit signup, login, browsing, booking, and chat requests, while owners submit listing and booking decision requests. The system then returns dashboards, confirmation messages, and streamed chat responses. The figure emphasizes that all internal processing is encapsulated inside a single platform boundary.

3.3 DFD Level 1

The Level 1 data flow diagram expands the system into its major sub-processes and shows how each process interacts with the underlying data stores. This level provides a clearer picture of the internal implementation without descending into component-level detail.

```mermaid
flowchart TB
  Farmer[Farmer]
  Owner[Equipment Owner]
  Browser[Browser]
  NVIDIA[NVIDIA NIM API]

  P1((1. Auth))
  P2((2. Browse & View Equipment))
  P3((3. List Equipment))
  P4((4. Create Booking))
  P5((5. Approve/Reject Booking))
  P6((6. Notifications))
  P7((7. Chat Assistant))

  D1[(Supabase Auth)]
  D2[(users)]
  D3[(equipments)]
  D4[(equipment_images)]
  D5[(bookings)]
  D6[(notifications)]
  D7[(Supabase Storage)]

  Farmer --> P1
  Owner --> P1
  P1 <--> D1
  P1 <--> D2

  Farmer --> P2
  Owner --> P2
  P2 <--> D3
  P2 <--> D4
  P2 <--> D2

  Owner --> P3
  P3 <--> D2
  P3 <--> D3
  P3 <--> D4
  P3 <--> D7

  Farmer --> P4
  P4 <--> D3
  P4 <--> D5
  P4 --> P6
  P6 <--> D6

  Owner --> P5
  P5 <--> D2
  P5 <--> D3
  P5 <--> D5
  P5 --> P6

  Farmer --> P7
  Owner --> P7
  P7 --> NVIDIA
  NVIDIA --> P7

  Browser --> P1
```

Figure 3.3 shows the Level 1 DFD. The diagram decomposes the platform into authentication, equipment browsing, equipment listing, booking creation, booking decision handling, notifications, and chat assistance. It also shows the main data stores used by each process: `users`, `equipments`, `equipment_images`, `bookings`, `notifications`, Supabase Auth, and Supabase Storage. This figure explains how each functional area is connected to the database and how the application maintains separation between user-facing operations and persistence.

3.4 Use Case Diagram

The use case view of AgriRent identifies the primary interactions available to the two user roles and the system-level notification behavior used internally. It helps to clarify what each actor can do within the implemented scope of the project.

```mermaid
flowchart LR
  Farmer((Farmer))
  Owner((Owner))
  System((System))
  Admin((Admin/System Role))

  UC1[Sign up]
  UC2[Log in]
  UC3[Browse equipment]
  UC4[View equipment details]
  UC5[Request booking]
  UC6[View booking history]
  UC7[View notifications]
  UC8[Use chat assistant]

  UC9[List equipment]
  UC10[Upload equipment photo]
  UC11[View dashboard]
  UC12[Approve booking]
  UC13[Reject booking]

  UC14[Insert system notification]

  Farmer --> UC1
  Farmer --> UC2
  Farmer --> UC3
  Farmer --> UC4
  Farmer --> UC5
  Farmer --> UC6
  Farmer --> UC7
  Farmer --> UC8

  Owner --> UC1
  Owner --> UC2
  Owner --> UC9
  Owner --> UC10
  Owner --> UC11
  Owner --> UC12
  Owner --> UC13
  Owner --> UC7
  Owner --> UC8

  Admin --> UC14
  System --> UC14
```

Figure 3.4 presents the use case diagram. The figure shows that the farmer role is centered on discovery and booking, while the owner role is centered on listing management and booking decisions. Both roles can authenticate and use the chat assistant. The diagram also shows the internal notification insertion use case, which is performed by the system through a server-only path rather than by an end user directly.

3.5 Activity Diagram

The activity flow of AgriRent describes the operational sequence from user entry to role-specific actions. It shows how the application branches based on authentication status and user role.

```mermaid
flowchart TD
  A([Start]) --> B[User opens app]
  B --> C{Authenticated?}
  C -- No --> D[Go to login/signup]
  D --> E[Create account or log in]
  E --> F[Session created]
  C -- Yes --> G{Role}
  F --> G

  G -- Farmer --> H[Browse equipment]
  H --> I[Open equipment detail]
  I --> J[Select date range]
  J --> K[Submit booking request]
  K --> L[Server validates and computes total]
  L --> M[Store booking as pending]
  M --> N[Notify owner]
  N --> O[Farmer views booking status]

  G -- Owner --> P[View owner dashboard]
  P --> Q[Review pending bookings]
  Q --> R{Decision}
  R -- Approve --> S[Update booking to approved]
  R -- Reject --> T[Update booking to rejected]
  S --> U[Notify farmer]
  T --> U
  U --> V[Owner sees updated dashboard]

  G -- Farmer or Owner --> W[Open chat assistant]
  W --> X[Send message to /api/chat]
  X --> Y[Stream FAQ response]
  O --> Z([End])
  V --> Z
  Y --> Z
```

Figure 3.5 illustrates the activity diagram for the application. The figure shows the complete behavior of the system from login to role-based execution paths. For farmers, the flow ends with booking request submission and status viewing. For owners, the flow ends with booking review and decision-making. The chat assistant branch is shown separately because it is available to both roles and does not alter database state.

3.6 Sequence Diagram

The sequence diagram focuses on one of the most important implemented flows: a farmer requesting a booking for an equipment item. This sequence shows the order of interaction between the user interface, server action, booking service, database, and notification service.

```mermaid
sequenceDiagram
  actor Farmer
  participant UI as BookingRequestForm
  participant Action as createBookingAction
  participant Service as booking.service
  participant DB as Supabase Postgres
  participant Notify as notification.service
  participant Owner as Owner Dashboard

  Farmer->>UI: Select date range and click Request booking
  UI->>Action: formData(equipmentId, startDate, endDate)
  Action->>Service: createBooking(input, farmerId)
  Service->>DB: Read equipment rate and owner_id
  DB-->>Service: equipment row
  Service->>DB: Insert booking(pending, computed total_amount)
  DB-->>Service: booking row or exclusion error
  alt booking inserted
    Service->>Notify: createNotification(ownerId, bookingId, message)
    Notify->>DB: Insert notification via service role
    DB-->>Notify: notification row
    Notify-->>Service: success
    Service-->>Action: success
    Action-->>UI: booking requested
    UI-->>Farmer: toast success
    Note over Owner: Owner dashboard will show new pending request
  else overlap or error
    Service-->>Action: friendly failure message
    Action-->>UI: failure
    UI-->>Farmer: show error
  end
```

Figure 3.6 shows the sequence for booking creation. The diagram demonstrates that the server first loads the equipment data, computes the booking amount, and then attempts the insert. If the insert succeeds, the system creates a notification for the owner. If the booking conflicts with an existing active reservation, the user receives a friendly failure message instead of a raw database error. The figure highlights the role of the service layer in protecting the booking workflow.

3.7 Module Interaction

The modules in AgriRent are organized so that the user interface, business logic, validation, and data access remain separated. This structure makes the application easier to understand and reduces coupling between the parts of the system.

- Authentication module
  - Handles signup, login, logout, session refresh, and role-based redirects.
  - Interacts with Supabase Auth and the `users` table.
- Equipment module
  - Handles equipment creation, equipment browsing, and equipment detail display.
  - Interacts with `equipments`, `equipment_images`, and Supabase Storage.
- Booking module
  - Handles booking request creation, approval, and rejection.
  - Interacts with `bookings` and uses server-side price calculation.
- Notification module
  - Creates and reads booking notifications.
  - Uses a service-role client for inserts and a normal server client for reads.
- Chat module
  - Handles user chat input and streaming AI responses.
  - Interacts with the `/api/chat` route and the NVIDIA NIM API.
- Validation module
  - Uses Zod schemas for auth, equipment, and booking input validation.
  - Prevents invalid or tampered payloads from reaching the business logic layer.
- Presentation module
  - Contains pages, layouts, forms, cards, calendars, and buttons used in the UI.
  - Provides the interactive interface for farmers and owners.

The module interaction pattern is primarily top-down. User actions start in the presentation layer, pass through a server action when mutation is required, then reach a service function that performs the business logic, and finally interact with the database or external API. This design ensures that the application remains maintainable and that critical rules such as owner-only listing creation, pending-only booking updates, and server-side total calculation remain enforced consistently across the system.

