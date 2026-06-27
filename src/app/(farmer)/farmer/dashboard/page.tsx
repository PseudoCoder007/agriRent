import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { createClient } from "@/lib/supabase/server";
import * as bookingService from "@/lib/services/booking.service";
import * as notificationService from "@/lib/services/notification.service";
import { CancelBookingButton } from "./CancelBookingButton";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  completed: "outline",
  cancelled: "outline",
};

export default async function FarmerDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const farmerId = userData.user.id;

  const [bookingsResult, notificationsResult] = await Promise.all([
    bookingService.getBookingsForFarmer(farmerId),
    notificationService.getNotificationsForUser(farmerId),
  ]);

  const bookings = bookingsResult.data ?? [];
  const notifications = notificationsResult.data ?? [];

  const completedCount = bookings.filter(
    (b) => b.status === "completed"
  ).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter(
    (b) => b.status === "approved"
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;

  const recentActivity = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <PageShell title="Farmer dashboard" subtitle="Track your bookings and activity">

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-semibold">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-semibold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-semibold">{cancelledCount}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">My Bookings</h2>
        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Browse equipment listings to request a booking."
            action={
              <Link
                href="/browse"
                className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
              >
                Browse equipment
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div>
                  <p>{booking.equipments?.title ?? "Equipment"}</p>
                  <p className="text-muted-foreground">
                    {booking.start_date} to {booking.end_date} — ₹
                    {booking.total_amount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={STATUS_VARIANT[booking.status] ?? "secondary"}
                  >
                    {booking.status}
                  </Badge>
                  {booking.status === "pending" ? (
                    <CancelBookingButton bookingId={booking.id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <ul className="space-y-1">
            {recentActivity.map((item) => (
              <li key={item.id} className="rounded-md border p-2 text-sm">
                <p>{item.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
