CHAPTER 9
SELECTED CODE SNIPPETS

9.1 Authentication - Server Action

File Name: `src/app/actions/auth.actions.ts`

```ts
"use server";

import { redirect } from "next/navigation";

import * as authService from "@/lib/services/auth.service";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

function dashboardPathForRole(role: SignupInput["role"]) {
  return role === "owner" ? "/owner/dashboard" : "/farmer/dashboard";
}

export async function signUpAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authService.signUp(parsed.data);
  if (!result.success) {
    return result;
  }

  redirect(dashboardPathForRole(parsed.data.role));
}

export async function logInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the highlighted fields",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authService.logIn(parsed.data);
  if (!result.success || !result.data) {
    return result;
  }

  redirect(dashboardPathForRole(result.data.role));
}
```

Explanation:

- This server action file handles authentication requests from the login and signup pages.
- Zod validation is performed before calling the authentication service.
- Successful login or signup redirects the user to the correct role-based dashboard.

9.2 Supabase Client - Server

File Name: `src/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the session via Next's cookie store, so
 * it respects the signed-in user's session - every query is still subject to
 * Row Level Security (anon key under the hood, not service_role).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll was called from a Server Component - middleware
            // refreshes the session, so this can be safely ignored.
          }
        },
      },
    }
  );
}
```

Explanation:

- This is the server-side Supabase client used in Server Components, Server Actions, and route handlers.
- It reads session cookies through Next.js and keeps the authenticated session available on the server.
- The client uses the anon key, so row-level security remains active.

9.3 Supabase Client - Admin

File Name: `src/lib/supabase/admin.ts`

```ts
// Server-only. Bypasses RLS. Never import from a Client Component.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely - use
 * ONLY for trusted, system-generated writes that must act outside the
 * current user's permissions (e.g. inserting a notification on behalf of
 * another user). Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() must never be called from the browser - service_role bypasses RLS."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

Explanation:

- This client is reserved for server-only operations that must bypass row-level security.
- The project uses it for trusted notification inserts where the recipient is not the same as the actor.
- The browser is explicitly blocked from using this client.

9.4 Equipment CRUD - Listing Service

File Name: `src/lib/services/listing.service.ts`

```ts
export async function createEquipment(
  input: CreateEquipmentInput,
  ownerId: string,
  imageFile: File
): Promise<ServiceResult<EquipmentRow>> {
  const imageCheck = imageFileSchema.safeParse({
    size: imageFile.size,
    type: imageFile.type,
  });

  if (!imageCheck.success) {
    return {
      success: false,
      message: "Invalid image: must be JPEG/PNG/WebP under 5MB",
      data: null,
    };
  }

  const supabase = await createClient();

  const { data: callerUser, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", ownerId)
    .single();

  if (roleError || !callerUser || callerUser.role !== "owner") {
    return {
      success: false,
      message: "Only owner accounts can create equipment listings.",
      data: null,
    };
  }

  const { data: equipment, error: insertError } = await supabase
    .from("equipments")
    .insert({
      owner_id: ownerId,
      title: input.title,
      description: input.description,
      category: input.category,
      rate: input.rate,
      rate_unit: input.rateUnit,
      location: input.location,
    })
    .select()
    .single();

  if (insertError || !equipment) {
    console.error(
      "listing.service.createEquipment: equipments insert failed",
      insertError
    );
    return {
      success: false,
      message: "Could not create equipment listing. Please try again.",
      data: null,
    };
  }
}
```

Explanation:

- This service performs the core equipment creation workflow.
- It validates the uploaded photo, checks that the caller is an owner, and inserts the equipment row.
- The same service also handles storage upload and image metadata insertion in the full implementation.

9.5 Booking - Service Layer

File Name: `src/lib/services/booking.service.ts`

```ts
function computeDurationInUnits(startDate: string, endDate: string): number {
  const duration =
    differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
  return Math.max(duration, 1);
}

export async function createBooking(
  input: CreateBookingInput,
  farmerId: string
): Promise<ServiceResult<BookingRow>> {
  const supabase = await createClient();

  const { data: equipment, error: equipmentError } = await supabase
    .from("equipments")
    .select("rate, rate_unit, owner_id")
    .eq("id", input.equipmentId)
    .single();

  if (equipmentError || !equipment) {
    console.error(
      "booking.service.createBooking: equipment lookup failed",
      equipmentError
    );
    return {
      success: false,
      message: "Could not find this equipment listing.",
      data: null,
    };
  }

  const durationInUnits = computeDurationInUnits(
    input.startDate,
    input.endDate
  );
  const totalAmount = Number(equipment.rate) * durationInUnits;
}
```

Explanation:

- This snippet shows the booking amount calculation and equipment lookup logic.
- The booking total is computed on the server from the stored equipment rate and date range.
- The service is responsible for the integrity of the booking workflow, not the client.

9.6 Middleware - Role Guard

File Name: `src/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isFarmerPath = path.startsWith("/farmer");
  const isOwnerPath = path.startsWith("/owner");
}
```

Explanation:

- This middleware refreshes the session and protects the role-based route groups.
- It reads the authenticated user from cookies, then checks whether the path is for farmer or owner routes.
- It supports the app’s defense-in-depth authorization model.

9.7 Server Action - Booking Creation

File Name: `src/app/actions/booking.actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as bookingService from "@/lib/services/booking.service";
import { createBookingSchema } from "@/lib/validations/booking.schema";

export async function createBookingAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in to request a booking.",
      data: null,
    };
  }

  const parsed = createBookingSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please select a valid date range",
      data: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await bookingService.createBooking(
    parsed.data,
    userData.user.id
  );

  if (result.success) {
    revalidateDashboards();
  }

  return result;
}
```

Explanation:

- This server action receives the booking form submission as `FormData`.
- It validates the input, derives the current user from the session, and delegates the booking write to the service layer.
- On success, it revalidates both dashboards so updated booking data appears immediately.

9.8 React Component - Booking Request Form

File Name: `src/app/(farmer)/equipment/[id]/BookingRequestForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { createBookingAction } from "@/app/actions/booking.actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export function BookingRequestForm({
  equipmentId,
  rate,
  rateUnit,
}: {
  equipmentId: string;
  rate: number;
  rateUnit: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const durationInUnits =
    range?.from && range?.to
      ? Math.max(differenceInCalendarDays(range.to, range.from) + 1, 1)
      : 0;
  const estimatedTotal = durationInUnits * rate;
}
```

Explanation:

- This client component provides the booking interaction on the equipment detail page.
- It lets the farmer select a date range and shows an estimate before submission.
- The actual booking amount is still computed on the server, so the UI estimate is only informational.

9.9 API Route - Chat Assistant

File Name: `src/app/api/chat/route.ts`

```ts
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getChatCompletion, type ChatMessage } from "@/lib/services/ai.service";

export const maxDuration = 60;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return jsonError("You must be logged in to use the chatbot.", 401);
  }
}
```

Explanation:

- This route is the single external entry point for the FAQ assistant.
- It requires an authenticated session and validates the request body before calling the AI service.
- The route is given a longer max duration because AI responses can take longer than ordinary application requests.

9.10 Database Schema - Booking Table

File Name: `supabase/migrations/0001_init_schema.sql`

```sql
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id),
  farmer_id uuid NOT NULL REFERENCES public.users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'approved'));
```

Explanation:

- This schema snippet shows the booking table and the database-level overlap protection.
- The exclusion constraint is the authoritative safeguard against double-booking for active reservations.
- The booking table is central to the marketplace workflow and supports the farmer-to-owner request flow.

