import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import * as bookingService from "@/lib/services/booking.service";
import * as notificationService from "@/lib/services/notification.service";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

/**
 * Bare-minimum farmer dashboard (no stats, no polish, per SKELETON.md):
 * booking history with per-booking status sourced from the DB, and an
 * embedded plain-list notification view (D-06 — no separate /notifications
 * route). Server Component making direct service-layer calls, never a raw
 * query (CLAUDE.md service-layer rule).
 */
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <h1 className="text-lg font-medium">Farmer dashboard</h1>

      <section>
        <h2 className="text-sm font-semibold">My Bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No bookings yet. Browse equipment to request one.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
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
                <Badge variant={STATUS_VARIANT[booking.status] ?? "secondary"}>
                  {booking.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {notifications.map((notification) => (
              <li key={notification.id} className="rounded-md border p-2 text-sm">
                <p>{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
