CHAPTER 1
INTRODUCTION

1.1 Background of the Study

Agricultural equipment rental has become an important support service for modern farming, especially for small and medium-scale farmers who cannot justify the full cost of purchasing machinery for occasional use. Tractors, harvesters, sprayers, ploughs, rotavators, and related equipment are often required only during specific farming seasons. In such situations, access to a dependable rental platform can improve productivity, reduce capital expenditure, and make mechanized farming more accessible.

In many practical settings, however, the process of finding equipment and coordinating rentals remains fragmented. Farmers typically rely on personal contacts, informal phone calls, or local intermediaries to identify available machinery. This approach can be time-consuming and can create uncertainty regarding equipment availability, pricing, and booking confirmation. For equipment owners, the absence of a structured digital system makes it difficult to present listings consistently, manage booking requests, and keep track of rental activity in an organized manner.

AgriRent is developed as a web-based farm equipment rental marketplace to address this need. The system connects equipment owners who list machinery with farmers who want to rent equipment for a specific date range. The implementation is built on Next.js, TypeScript, Supabase, and shadcn/ui, and it supports authenticated user access, role-based navigation, equipment listing management, booking requests, booking decisions, notifications, and an FAQ-style chat assistant. The application is designed as a complete working platform rather than a static demonstration, with the core business logic handled on the server and the database used as the source of truth.

1.2 Purpose of the Project

The primary purpose of AgriRent is to provide a functional and structured online system for agricultural equipment rental. The project aims to make the rental process more organized for both farmers and equipment owners by replacing informal coordination with a centralized web application.

The specific purposes of the project are:

- To allow farmers to browse available equipment listings and inspect equipment details before making a request.
- To enable farmers to request equipment for a particular date range through a booking workflow.
- To allow equipment owners to create and manage equipment listings through a dedicated owner interface.
- To support booking approval and rejection by the equipment owner based on the current status of each request.
- To calculate the booking total on the server using the stored equipment rate, ensuring that pricing is not dependent on client-side input.
- To store user identity, role, equipment data, bookings, images, and notifications in a structured Supabase-backed database.
- To provide a simple chat assistant for general questions related to the platform and its rental process.

The project therefore serves as a practical full-stack application for agricultural rental management. It demonstrates how a role-based marketplace can be implemented with strong validation, server-side business rules, and database-backed integrity.

1.3 Scope of the System

The scope of AgriRent is limited to the features that are currently implemented in the codebase. The system is intentionally focused on the rental marketplace workflow and does not extend into broader agricultural supply-chain services.

The system currently covers two main user roles: farmer and equipment owner. A user selects one of these roles during signup, and the role is stored in the application database rather than in editable client-side metadata. This role determines the pages the user can access and the actions available to them.

For farmers, the system provides account creation, login, equipment browsing, equipment detail viewing, booking requests, booking history, notifications, and access to the chat assistant. For equipment owners, the system provides account creation, login, equipment listing creation, booking request review, notifications, and access to the same chat assistant. The application also includes role-protected layouts that redirect users when they enter a section intended for another role.

The booking workflow is limited to the request-and-decision cycle. A farmer can request a booking for an equipment item, and the owner can approve or reject that request. The system stores booking status values such as pending, approved, and rejected, while the current user interface focuses on this operational flow. The codebase also contains completed database support for notification storage and image storage for equipment listings.

The application does not currently implement advanced search filters, profile editing screens, payments, reviews, maps, or background job processing. Those capabilities are not part of the present implementation and are therefore outside the scope of this chapter.

1.4 Problem Statement

Farm equipment rental becomes inefficient when the process depends on informal communication and manual record keeping. Farmers may struggle to discover which equipment is available, while owners may find it difficult to manage requests, track the status of bookings, and communicate changes in a reliable way. In such a process, mistakes can occur in scheduling, availability can be misunderstood, and the coordination burden becomes unnecessarily high.

The problem addressed by AgriRent is the lack of a simple, role-based digital system for managing agricultural equipment rentals. A usable system in this domain must support at least three critical concerns. First, it must allow a farmer to view available equipment and create a booking request without depending on phone calls or in-person visits. Second, it must allow the owner to review those requests and respond in a controlled manner. Third, it must protect the booking process from data tampering and booking conflicts by enforcing validation and server-side checks.

AgriRent addresses these concerns by combining a modern web interface with Supabase-backed authentication, structured database tables, row-level security, and server-side booking logic. The database validates ownership and availability, the server calculates the final booking amount, and the application stores notifications to keep both parties informed. In this way, the platform converts an informal rental process into a more reliable digital workflow.

1.5 Objectives of the Project

The main objectives of AgriRent are listed below:

- To design and implement a web-based marketplace for agricultural equipment rental.
- To provide secure registration and login for two user roles: farmer and equipment owner.
- To store user profiles in a dedicated database table and use the stored role for access control.
- To allow equipment owners to create equipment listings with descriptions, rates, categories, locations, and photos.
- To allow farmers to browse equipment and open detailed equipment pages before booking.
- To implement a date-range booking request system for farmers.
- To compute booking totals on the server using the equipment rate stored in the database.
- To prevent overlapping active bookings through database-level constraints.
- To provide booking review tools so that owners can approve or reject booking requests.
- To generate notifications for booking events and display them in the dashboards.
- To support a simple FAQ chat assistant for general platform guidance.
- To ensure that the application follows secure and maintainable full-stack development practices.

These objectives reflect the implemented structure of the application. The project is not intended to solve every possible rental-domain requirement, but rather to deliver a working and well-structured core marketplace that demonstrates the essential booking lifecycle from listing creation to booking decision.

1.6 Significance of the Project

AgriRent is significant because it applies full-stack web development to a real operational problem in agricultural access and equipment coordination. The project demonstrates how a marketplace can be organized around distinct user responsibilities while still maintaining a simple and understandable user experience.

For farmers, the system reduces the difficulty of discovering and requesting equipment. Instead of relying only on informal communication, they can use a structured interface to inspect available listings, review rates, and submit booking requests. For equipment owners, the platform provides a consistent way to publish listings and manage incoming requests without relying on scattered messages or manual notes.

From a technical perspective, the project demonstrates the use of several important software engineering practices. The codebase separates responsibilities into server actions, service functions, validation schemas, and UI components. This separation improves readability and makes the booking process easier to reason about. The system also uses Supabase row-level security and database constraints so that business rules are enforced beyond the user interface. This is important because a rental system must not trust client-supplied pricing or availability information.

The project is also significant as an academic implementation because it shows the integration of authentication, authorization, database design, storage management, and interactive user interfaces in a single application. The resulting system is a practical example of how a domain-specific marketplace can be built using a modern JavaScript framework and a managed backend platform.

1.7 Organization of the Report

This report is organized in a chapter-wise manner. Chapter 1 introduces the project background, purpose, scope, problem statement, objectives, and significance. Chapter 2 typically presents system analysis and the rationale for the proposed solution. Subsequent chapters describe system design, database design, implementation details, testing, and conclusion.

In the context of the AgriRent project, the present chapter establishes the motivation and boundaries of the system. It provides the foundation for the technical discussion that would follow in later chapters by clarifying what the application is intended to do and which features are currently implemented.

