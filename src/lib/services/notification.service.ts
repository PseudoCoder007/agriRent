import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type NotificationRow = Tables<"notifications">;

/**
 * Writes a notification on behalf of another user (the booking's "other
 * party" — e.g. notifying an owner that a farmer requested a booking, or
 * notifying a farmer their booking was approved/rejected). This crosses a
 * normal per-user RLS boundary by design: the authenticated actor making
 * the request is never the same user as the notification's recipient, and
 * `public.notifications` intentionally has no INSERT policy for the
 * `authenticated` role (see 0001_init_schema.sql comment on table 9 and
 * ARCHITECTURE.md Pattern 3). The service-role admin client is the narrow,
 * audited exception that makes this system-generated write possible.
 *
 * Callers in booking.service.ts always `await` this before returning —
 * never fire-and-forget — because Vercel Hobby gives no guaranteed
 * post-response execution (see T-05-05).
 */
export async function createNotification({
  userId,
  bookingId,
  message,
}: {
  userId: string;
  bookingId: string;
  message: string;
}): Promise<ServiceResult<NotificationRow>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, booking_id: bookingId, message })
    .select()
    .single();

  if (error || !data) {
    console.error("notification.service.createNotification: insert failed", error);
    return {
      success: false,
      message: "Could not create notification",
      data: null,
    };
  }

  return {
    success: true,
    message: "Notification created",
    data,
  };
}

/**
 * Reads a user's own notifications. Uses the regular RLS-respecting server
 * client — a user reading their own notifications is exactly what the
 * "notifications select own" SELECT policy from 0001_init_schema.sql
 * already allows, so no admin-client bypass is needed here.
 */
export async function getNotificationsForUser(
  userId: string
): Promise<ServiceResult<NotificationRow[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "notification.service.getNotificationsForUser: query failed",
      error
    );
    return {
      success: false,
      message: "Could not load notifications",
      data: null,
    };
  }

  return {
    success: true,
    message: "Notifications loaded",
    data: data ?? [],
  };
}
