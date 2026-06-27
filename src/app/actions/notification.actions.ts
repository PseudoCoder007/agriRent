"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import * as notificationService from "@/lib/services/notification.service";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

export async function getUnreadNotificationsAction(): Promise<
  ActionResult & {
    data: { id: string; message: string; created_at: string }[] | null;
  }
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { success: false, message: "Not logged in", data: null };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, message, created_at")
    .eq("user_id", userData.user.id)
    .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("getUnreadNotificationsAction: query failed", error);
    return { success: false, message: "Could not load notifications", data: null };
  }

  return { success: true, message: "OK", data };
}

export async function getUnreadCountAction(): Promise<
  ActionResult & { data: number | null }
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { success: false, message: "Not logged in", data: null };
  }

  const result = await notificationService.getUnreadCount(userData.user.id);
  return result as ActionResult & { data: number | null };
}

export async function markNotificationsReadAction(
  ids: string[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      success: false,
      message: "You must be logged in.",
      data: null,
    };
  }

  const result = await notificationService.markNotificationsRead(ids);

  if (result.success) {
    revalidatePath("/owner/dashboard");
    revalidatePath("/farmer/dashboard");
  }

  return result;
}
