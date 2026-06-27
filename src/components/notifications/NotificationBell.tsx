"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import {
  getUnreadNotificationsAction,
  markNotificationsReadAction,
} from "@/app/actions/notification.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type NotificationRow = {
  id: string;
  message: string;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    const result = await getUnreadNotificationsAction();
    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.data.length);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<NotificationRow>) => {
          const newNotification = payload.new as NotificationRow;
          if (newNotification?.id) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function handleMarkRead() {
    if (notifications.length === 0) return;

    const ids = notifications.map((n) => n.id);
    const result = await markNotificationsReadAction(ids);

    if (result.success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            {unreadCount > 0
              ? "Notifications loading..."
              : "No new notifications"}
          </DropdownMenuItem>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-1">
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </DropdownMenuItem>
          ))
        )}
        {notifications.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMarkRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
