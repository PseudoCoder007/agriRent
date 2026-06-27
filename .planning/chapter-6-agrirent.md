CHAPTER 6
HARDWARE & SOFTWARE REQUIREMENTS

6.1 Hardware Requirements

The AgriRent application is a web-based marketplace built with a modern JavaScript framework and a managed backend platform. Because of this architecture, the hardware requirements are moderate at the development level and minimal at the client level. The system is intended to run in standard web browsers and does not require specialized local hardware for end users. For development and testing, however, a reasonably capable machine is recommended to support Next.js compilation, TypeScript tooling, browser debugging, and local package management.

6.1.1 Development Machine

The development machine is the workstation used for building, testing, and maintaining the AgriRent application. Since the project uses Next.js, React, TypeScript, Supabase integration, and client-side form handling, the machine should be able to run a modern editor, a browser, and the local development server simultaneously without significant slowdown.

| Component | Minimum Specification | Recommended Specification |
|-----------|-----------------------|---------------------------|
| Processor | Intel Core i5 / AMD Ryzen 5 | Intel Core i7 / AMD Ryzen 7 or equivalent |
| RAM | 8 GB | 16 GB or higher |
| Storage | 256 GB SSD | 512 GB SSD or higher |
| Network | Stable broadband connection | High-speed broadband connection |
| Display | 1366 × 768 | 1920 × 1080 Full HD or higher |
| Operating System | Windows 10 / Ubuntu 20.04 / macOS | Windows 11 / Ubuntu 22.04 / macOS latest supported release |

The minimum specification is sufficient for basic development and testing. The recommended specification is more appropriate for smooth multitasking, especially when running the Next.js development server, browser tabs, Supabase-related tooling, and code editors at the same time.

6.1.2 Recommended Hardware

For a comfortable development experience, the following hardware configuration is recommended:

- Multi-core processor for faster compilation and responsive development workflows.
- At least 16 GB RAM to support the editor, browser, local server, and debugging tools simultaneously.
- SSD storage to improve project loading, dependency installation, and build performance.
- Reliable internet connectivity for Supabase authentication, storage, and deployment testing.

The project does not require GPU acceleration or server-grade hardware during development. Since the application uses a managed backend and a browser-based front end, the main hardware demand is general-purpose development capacity rather than specialized processing power.

6.1.3 Cloud Requirements

Although the local development machine is responsible for coding and testing, the deployed system depends on cloud services for hosting and data persistence. The cloud-side requirements are therefore important to the overall operation of the project.

| Cloud Component | Requirement | Purpose |
|-----------------|-------------|---------|
| Vercel deployment | A Vercel project connected to the repository | Hosts the Next.js application in production |
| Supabase project | Supabase project with Auth, PostgreSQL, and Storage enabled | Stores users, listings, bookings, images, and notifications |
| Network access | Stable internet connectivity | Required for API calls, authentication, and storage interactions |

The project does not require custom cloud infrastructure, virtual machines, or self-managed database servers. The application is designed around managed platform services so that the deployment complexity stays low and the system remains suitable for a final-year project implementation.

6.2 Software Requirements

The software requirements are derived directly from the actual implementation of the project. AgriRent is built as a full-stack Next.js application with Supabase as the backend platform, so the required software stack is centered on a modern browser runtime, Node.js tooling, and the platform services used by the codebase.

6.2.1 Operating System

The development environment can run on multiple operating systems as long as the required JavaScript tooling and browser support are available. The project is platform-independent at the application level, but the development stack should support Next.js, npm, Git, and a modern browser.

| Software | Version / Support | Purpose |
|----------|-------------------|---------|
| Windows | Windows 10 or Windows 11 | Development and testing environment |
| Linux | Ubuntu 20.04 / 22.04 or equivalent | Alternative development environment |
| macOS | Recent supported macOS versions | Alternative development environment |

The application itself is browser-based and can run on any operating system that supports the required development tools. The project does not depend on operating-system-specific functionality.

6.2.2 Runtime and Framework Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | Current LTS-compatible version | Runtime for Next.js development, build, and package management |
| Next.js | 15.x | Application framework, routing, server actions, and server components |
| React | 19.x | User interface library used by Next.js |
| TypeScript | 5.x | Static typing and compile-time safety across the codebase |
| Tailwind CSS | 4.x | Utility-first styling framework |

Node.js is required because the project uses npm-based tooling and the Next.js development server. Next.js provides the App Router architecture, server actions, route handlers, and layout structure used throughout the application. React supplies the component model for the UI, while TypeScript strengthens the reliability of form validation, service functions, and database typing.

6.2.3 UI and Validation Libraries

| Software | Version | Purpose |
|----------|---------|---------|
| shadcn/ui | Project-generated component set | Accessible UI primitives such as card, button, form, calendar, select, and dialog |
| Zod | 4.x | Runtime validation for authentication, equipment, and booking payloads |
| react-hook-form | 7.x | Client-side form state management |
| `@hookform/resolvers` | 5.x | Zod resolver integration |
| date-fns | 4.x | Date range calculation and formatting |
| sonner | 2.x | Toast notifications |

These libraries are used directly in the project. The forms on the auth, equipment, and booking pages rely on react-hook-form and Zod. The booking workflow uses date-fns to calculate the date range estimate shown to the user. Sonner provides success and error feedback after actions such as booking submission and booking approval.

6.2.4 Backend and Data Requirements

| Software | Version / Support | Purpose |
|----------|-------------------|---------|
| Supabase | Managed service | Authentication, PostgreSQL database, storage, and row-level security |
| PostgreSQL | Supabase-managed PostgreSQL | Persistent storage for application data |
| Supabase Storage | Managed storage | File storage for equipment images |

Supabase is essential to the application because it provides the authentication, database, and storage layers used by the project. PostgreSQL stores the relational data model, while Supabase Storage holds uploaded equipment photographs. The application also uses Supabase row-level security and server-side helper functions to protect sensitive operations.

6.2.5 Environment and Package Management

| Software | Purpose |
|----------|---------|
| npm | Dependency installation, scripts, and package management |

The project uses npm scripts for development and build tasks. Since the repository is already configured with a package lock file, npm is the natural and consistent package manager for the implementation.

6.3 Development Tools

The following tools are used to develop, inspect, and maintain the AgriRent codebase.

| Tool | Purpose |
|------|---------|
| Visual Studio Code | Primary source code editor used for application development |
| Git | Version control and local change tracking |
| GitHub | Remote repository hosting and collaboration |
| npm | Dependency installation and script execution |
| Chrome DevTools | Browser debugging, console inspection, and UI troubleshooting |

Visual Studio Code is suitable for the project because it supports TypeScript, React, Tailwind CSS, and Supabase-related development workflows. Git is necessary for source control, and GitHub provides a remote platform for storing the code and tracking changes. npm is used to install packages and run project scripts such as development and build commands. Chrome DevTools is important for checking UI behavior, network activity, browser-side errors, and layout rendering.

Additional supporting tools used in the project environment include:

- Supabase dashboard for project configuration and database management.
- Browser-based inspection for testing authenticated flows and responsive rendering.
- Terminal or PowerShell for running local development commands.

6.4 Deployment Environment

The deployment environment of AgriRent is intentionally simple and aligned with the implemented architecture. The application is designed for deployment on Vercel, while the backend services are provided by Supabase. This separation allows the front-end application and backend platform to scale independently without requiring a custom server infrastructure.

6.4.1 Vercel

Vercel is the primary deployment platform for the Next.js application. It is well suited to the project because the codebase uses Next.js App Router, server actions, and route handlers. Vercel supports these features natively and provides a straightforward production deployment path.

Vercel is responsible for:

- Hosting the Next.js application.
- Serving the front-end pages and server-rendered routes.
- Executing server actions and API route handlers.
- Providing an environment for production builds and previews.

The current application structure fits Vercel well because the codebase does not require a separate application server. The deployment model is therefore lightweight and practical for a college project and portfolio demonstration.

6.4.2 Supabase

Supabase is the backend deployment platform used by AgriRent. It provides the managed services that replace a self-hosted backend stack.

Supabase is responsible for:

- Authentication and session management.
- PostgreSQL database hosting.
- File storage for equipment images.
- Row-level security enforcement.
- Service-role access for narrowly scoped system operations.

The deployment environment depends on correct Supabase configuration, including project URL, anon key, service role key, and storage setup. Because the application reads user role information from the `users` table and relies on row-level security to protect data access, Supabase is not just a storage layer but a core part of the application architecture.

6.4.3 Deployment Summary

The overall deployment environment can therefore be summarized as follows:

- Frontend and application logic deployed on Vercel.
- Database, authentication, and storage hosted on Supabase.
- External AI chat requests routed through the server to an OpenAI-compatible NVIDIA NIM endpoint.

This deployment structure keeps the production setup manageable and removes the need for dedicated infrastructure administration. It also matches the project’s current scope, which focuses on a working marketplace rather than on custom server operations.

