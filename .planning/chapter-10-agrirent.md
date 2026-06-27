CHAPTER 10
CONCLUSION AND FUTURE SCOPE

10.1 Summary

AgriRent is a web-based farm equipment rental marketplace developed to connect equipment owners with farmers in a structured and role-based environment. The implemented system allows owners to create equipment listings, upload equipment photographs, and manage incoming booking requests. Farmers can register, log in, browse available equipment, inspect listing details, and request bookings for a selected date range. The project also includes booking approval and rejection workflows, dashboard views for both roles, notification storage, and a chat assistant for general platform guidance.

The application is implemented using Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. The architecture separates presentation, server actions, service logic, validation, and database access so that the main business rules are enforced on the server side. Booking totals are computed from the stored equipment rate, booking conflicts are prevented at the database level, and role-based routing is handled through middleware and protected layouts. This design gives the project a clean and practical structure suitable for a final-year BCA implementation.

The project therefore demonstrates a complete though focused digital marketplace workflow. It addresses a real coordination problem in agricultural equipment rental by replacing informal communication with an application that supports authentication, listing management, booking requests, notifications, and controlled access based on user roles. The current implementation is intentionally scoped to the core marketplace flow and does not extend into unrelated features such as payments, reviews, maps, or advanced analytics.

10.2 Project Achievements

The project achieved the following major outcomes:

- A role-based authentication system was implemented using Supabase Auth.
- A persistent user profile table was created to store user identity and role information.
- Two distinct user experiences were implemented for farmers and equipment owners.
- Equipment owners can create listings with title, description, category, rate, location, and photo upload.
- Farmers can browse equipment listings and open detailed equipment pages.
- A date-range booking request workflow was implemented for farmers.
- Booking totals are computed on the server using the equipment rate stored in the database.
- The booking workflow is protected by a database-level exclusion constraint to prevent overlaps.
- Owners can approve or reject pending bookings from their dashboard.
- Notifications are stored and displayed to inform users about booking events.
- A lightweight FAQ chat assistant was integrated through a dedicated API route.
- The codebase includes validation schemas and service-layer separation for maintainability.

These achievements show that the project is not only a user-interface demonstration but a working full-stack application with practical data handling and server-side integrity checks.

10.3 Advantages

AgriRent provides several advantages over informal rental coordination and over a flat, unstructured web implementation.

First, it centralizes the rental process. Instead of depending on scattered phone calls or repeated offline communication, users can interact with a single marketplace platform. This improves clarity for both farmers and owners.

Second, it separates user responsibilities clearly. Farmers are focused on discovery and booking, while owners are focused on listing management and request approval. This role separation makes the system easier to understand and reduces accidental misuse.

Third, the system protects critical business data through server-side logic. The booking amount is calculated on the server, and overlapping active bookings are blocked by the database itself. This reduces the risk of tampering and double-booking.

Fourth, the project is technically maintainable. The use of server actions, service functions, and validation schemas keeps the codebase organized and easier to extend. The application structure also supports a clean separation between UI concerns and business logic.

Fifth, the deployment model is lightweight and practical. The use of Vercel and Supabase removes the need for a self-managed backend server while still providing authentication, storage, and a relational database. This makes the project suitable for a final-year academic environment and for small-scale real-world use.

10.4 Future Scope

The current AgriRent implementation covers the essential marketplace workflow, but several realistic improvements can be added in future versions. These enhancements should remain aligned with the existing architecture and should build on the implemented features rather than replacing them.

Possible future improvements include:

- Search and filtering
  - Add filters for category, location, price range, and availability so farmers can find listings faster.
- Profile management
  - Introduce a dedicated profile page so users can update their name, contact details, or account preferences.
- Booking history refinement
  - Add more detailed booking timelines and status labels for completed and cancelled bookings.
- Additional booking states
  - Extend the current booking lifecycle with completion and cancellation flows in the user interface.
- Equipment management enhancements
  - Allow owners to edit or deactivate listings instead of only creating them.
- Multi-image support improvements
  - Add richer gallery handling, image ordering, or image replacement tools for listings.
- Email notifications
  - Add email alerts for booking requests and booking decisions alongside the current in-app notifications.
- Review and rating system
  - Add post-booking feedback so farmers can rate equipment and owners can assess service quality.
- Location awareness
  - Add map-based browsing or location sorting for nearby equipment discovery.
- Dashboard analytics
  - Add summary cards and simple metrics such as total listings, pending bookings, and completed rentals.

These future enhancements are realistic because they extend the already implemented Supabase-backed marketplace model. They do not require a redesign of the entire system; rather, they can be layered on top of the current structure in subsequent phases.

10.5 Learning Outcomes

The development of AgriRent provided several important learning outcomes in both software engineering and application design.

From a frontend perspective, the project reinforced the use of Next.js App Router, server components, client components, and route groups. It also provided practical experience with form handling, component composition, responsive layout design, and toast-based user feedback.

From a backend perspective, the project improved understanding of server actions, service-layer patterns, authentication flows, and role-based access control. The use of Supabase demonstrated how authentication, database access, and file storage can be managed in a single platform without building a separate custom backend service.

From a database perspective, the project showed the value of relational schema design, foreign keys, row-level security, and database-level integrity constraints. The booking exclusion constraint, in particular, illustrates why some business rules are safer when enforced directly in the database rather than only in application code.

From a software process perspective, the project encouraged a disciplined separation between validation, server logic, and user interface concerns. It also emphasized the importance of testing important business rules, especially booking validation, pricing, and authentication behavior.

Overall, the project strengthened practical understanding of full-stack development and demonstrated how a focused domain problem can be solved with a clear, maintainable web architecture.

10.6 Conclusion

AgriRent fulfills its intended purpose as a farm equipment rental marketplace that connects farmers with equipment owners through a secure and structured digital workflow. The project successfully implements authentication, role-based navigation, equipment listing management, equipment browsing, booking requests, booking approvals and rejections, notifications, and a simple AI-assisted FAQ chat experience.

The system demonstrates the effective use of modern web development tools and shows how a small but complete marketplace can be built with a strong emphasis on server-side integrity and database reliability. The application is limited to its current scope, but within that scope it provides a working end-to-end rental flow that is consistent, maintainable, and suitable for academic presentation.

In conclusion, the project has achieved its core objective of replacing informal equipment rental coordination with a digital platform that is practical for farmers and owners. The implementation also leaves room for meaningful future enhancements in search, profile management, analytics, and richer booking workflows. As it stands, AgriRent is a clear demonstration of applied full-stack development, relational data modeling, and role-based web application design.

REFERENCES

[1] Next.js Documentation. *Next.js Official Documentation*. [https://nextjs.org/docs](https://nextjs.org/docs)

[2] React Documentation. *React Official Documentation*. [https://react.dev](https://react.dev/)

[3] TypeScript Documentation. *TypeScript Handbook*. [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)

[4] Supabase Documentation. *Supabase Official Documentation*. [https://supabase.com/docs](https://supabase.com/docs)

[5] PostgreSQL Global Development Group. *PostgreSQL Documentation*. [https://www.postgresql.org/docs](https://www.postgresql.org/docs)

[6] Tailwind CSS Documentation. *Tailwind CSS Official Documentation*. [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

[7] Vercel Documentation. *Vercel Deployment Documentation*. [https://vercel.com/docs](https://vercel.com/docs)

[8] Git Documentation. *Git SCM Documentation*. [https://git-scm.com/docs](https://git-scm.com/docs)

[9] GitHub Documentation. *GitHub Docs*. [https://docs.github.com](https://docs.github.com/)

[10] World Bank. *Agriculture and Agribusiness Resources*. [https://www.worldbank.org/en/topic/agriculture](https://www.worldbank.org/en/topic/agriculture)

[11] S. Suganth & K. Santhi (2025). *Smart Farming Equipment Rental System*. International Journal of Scientific Research in Computer Science, Engineering and Information Technology.

[12] A. S. Budhewar et al. (2025). *Implementation of Smart Agricultural Equipment Rental System*. International Journal of Advance Scientific Research and Engineering Trends.

