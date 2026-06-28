import { Search, ListCheck, MessageSquareText, Star, ShieldCheck, Trees } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const features = [
  {
    icon: Search,
    title: "Browse & discover",
    description: "Find tractors, harvesters, and more by category or location.",
  },
  {
    icon: ListCheck,
    title: "Request & book",
    description: "Pick your dates and send a booking request in one click.",
  },
  {
    icon: Star,
    title: "Review & rate",
    description: "Leave feedback after each completed rental.",
  },
  {
    icon: ShieldCheck,
    title: "No double-booking",
    description: "Availability enforced server-side with every request.",
  },
  {
    icon: MessageSquareText,
    title: "AI assistant",
    description: "Get recommendations and answers instantly.",
  },
  {
    icon: Trees,
    title: "For Indian farms",
    description: "Built for local equipment and rental practices.",
  },
];

export default async function Home(props: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await props.searchParams;

  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  return (
    <main className="force-light min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
        <section className="flex min-h-[80vh] flex-col justify-center gap-12 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Farm equipment marketplace
            </div>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Rent farm equipment{" "}
              <span className="text-emerald-700">without the friction.</span>
            </h1>

            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Owners list equipment, farmers book what they need, and the
              platform keeps pricing, availability, and booking status
              controlled end to end.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-8 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur">
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
                  <p className="text-sm font-medium text-slate-500">
                    One account, two roles
                  </p>
                  <p className="text-lg font-semibold text-slate-950">
                    Farmer or owner
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900">
                    For farmers
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-950/80">
                    Browse equipment, send booking requests, track status, and
                    leave reviews.
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    For owners
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-950/80">
                    Create listings, review requests, and approve or reject
                    bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Everything you need
            </h2>
            <p className="mt-2 text-slate-600">
              From discovery to booking to feedback — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-medium text-slate-950">
                  {feature.title}
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-950 px-8 py-16 text-center sm:px-16">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            Join AgriRent today and start renting or listing farm equipment in
            your area.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-700 px-8 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Log in
            </Link>
          </div>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          AgriRent — farm equipment rental marketplace
        </footer>
      </div>
    </main>
  );
}
