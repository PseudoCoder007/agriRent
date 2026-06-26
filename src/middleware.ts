import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session and syncs auth cookies on every request.
 * Required so server-rendered pages/Server Actions always see a fresh
 * session — without this, sessions can silently expire mid-navigation.
 */
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

  // Refreshing the session — do not remove this call, it keeps the session
  // alive and is required for Server Components to read a valid user.
  const { data: userData } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isFarmerPath = path.startsWith("/farmer");
  const isOwnerPath = path.startsWith("/owner");

  if (isFarmerPath || isOwnerPath) {
    if (!userData.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role is read only from the server-controlled public.users table —
    // never from Auth-provided user metadata (see 01-CONTEXT.md D-01/D-02).
    // This is a fast UX-level redirect; RLS remains the actual
    // authorization boundary for data access (see threat T-02-04).
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isOwnerPath && profile.role !== "owner") {
      return NextResponse.redirect(new URL("/farmer/dashboard", request.url));
    }

    if (isFarmerPath && profile.role !== "farmer") {
      return NextResponse.redirect(new URL("/owner/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
