import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import * as listingService from "@/lib/services/listing.service";
import * as bookingService from "@/lib/services/booking.service";
import * as notificationService from "@/lib/services/notification.service";
import { BookingActionButtons } from "./BookingActionButtons";

/**
 * Bare-minimum owner dashboard (no stats, no charts, no polish, per
 * SKELETON.md): equipment list, incoming booking requests with
 * Approve/Reject controls, and an embedded plain-list notification view
 * (D-06 — no separate /notifications route). Server Component making
 * direct service-layer calls, never a raw query (CLAUDE.md service-layer
 * rule).
 */
export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const ownerId = userData.user.id;

  const [equipmentResult, bookingsResult, notificationsResult] =
    await Promise.all([
      listingService.getEquipmentByOwner(ownerId),
      bookingService.getBookingsForOwner(ownerId),
      notificationService.getNotificationsForUser(ownerId),
    ]);

  const equipment = equipmentResult.data ?? [];
  const bookings = bookingsResult.data ?? [];
  const notifications = notificationsResult.data ?? [];
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const activeBookings = bookings.filter((b) => b.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <h1 className="text-lg font-medium">Owner dashboard</h1>

      <section>
        <h2 className="text-sm font-semibold">My Equipment</h2>
        {equipment.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No equipment listed yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {equipment.map((item) => (
              <li key={item.id} className="rounded-md border p-2 text-sm">
                {item.title} — ₹{item.rate}/{item.rate_unit}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Booking Requests</h2>
        {pendingBookings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No pending booking requests.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pendingBookings.map((booking) => (
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
                <BookingActionButtons bookingId={booking.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Active Bookings</h2>
        {activeBookings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No active bookings.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {activeBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>
                  {booking.equipments?.title ?? "Equipment"} —{" "}
                  {booking.start_date} to {booking.end_date}
                </span>
                <Badge variant="secondary">{booking.status}</Badge>
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
