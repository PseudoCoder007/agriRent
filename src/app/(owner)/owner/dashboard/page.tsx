import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { createClient } from "@/lib/supabase/server";
import * as listingService from "@/lib/services/listing.service";
import * as bookingService from "@/lib/services/booking.service";
import * as notificationService from "@/lib/services/notification.service";
import { BookingActionButtons } from "./BookingActionButtons";
import { CompleteCancelButtons } from "./CompleteCancelButtons";

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

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed"
  ).length;

  const recentActivity = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <PageShell title="Owner dashboard" subtitle="Manage your equipment and bookings">

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Listings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-2xl font-semibold">{equipment.length}</p>
          </CardContent>
        </Card>
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
              Active
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
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">My Equipment</h2>
        {equipment.length === 0 ? (
          <EmptyState
            title="No equipment listed"
            description="Create your first listing to start receiving booking requests."
            action={
              <Link href="/equipment/new" className={buttonVariants()}>
                List equipment
              </Link>
            }
          />
        ) : (
          <ul className="space-y-1">
            {equipment.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border p-2 text-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.equipment_images[0] ? (
                    <Image
                      src={listingService.getEquipmentImageUrl(
                        item.equipment_images[0].storage_path
                      )}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/equipment/${item.id}/edit`}
                    className="hover:underline"
                  >
                    <span className="truncate">
                      {item.title} — ₹{item.rate}/{item.rate_unit}
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">All Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookings for your equipment yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-2 rounded-md border p-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p>{booking.equipments?.title ?? "Equipment"}</p>
                  <p className="text-muted-foreground">
                    {booking.users?.full_name ?? "Unknown"} —{" "}
                    {booking.start_date} to {booking.end_date} — ₹
                    {booking.total_amount}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      booking.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {booking.status}
                  </Badge>
                  {booking.status === "pending" ? (
                    <BookingActionButtons bookingId={booking.id} />
                  ) : (
                    <CompleteCancelButtons
                      bookingId={booking.id}
                      status={booking.status}
                    />
                  )}
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
