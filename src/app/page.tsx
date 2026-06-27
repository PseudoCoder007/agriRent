import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home(props: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await props.searchParams;

  // Supabase email confirmation links land on ?code=<uuid>. Redirect to the
  // auth callback route which exchanges the code for a real session.
  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,200,130,0.22),_transparent_45%),linear-gradient(180deg,_#f7fbf6_0%,_#eef5ea_100%)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              AgriRent marketplace
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Rent farm equipment without the friction.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Owners list equipment, farmers book what they need, and the
                platform keeps pricing, availability, and booking status
                controlled end to end.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                Log in
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Farmer bookings</span>
              <span className="text-slate-300">•</span>
              <span>Owner listings</span>
              <span className="text-slate-300">•</span>
              <span>AI help</span>
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/globe.svg"
                alt="AgriRent"
                width={34}
                height={34}
                className="opacity-80"
                priority
              />
              <div>
                <p className="text-sm font-medium text-slate-500">Start here</p>
                <p className="text-lg font-semibold text-slate-950">
                  One home screen for both roles
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-900">
                  For farmers
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-950/80">
                  Browse equipment, open details, request a booking, and track
                  status.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">For owners</p>
                <p className="mt-2 text-sm leading-6 text-amber-950/80">
                  Create listings, review requests, and approve or reject
                  bookings.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
