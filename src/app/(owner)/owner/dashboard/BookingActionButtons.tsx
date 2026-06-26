"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  approveBookingAction,
  rejectBookingAction,
} from "@/app/actions/booking.actions";
import { Button } from "@/components/ui/button";

/**
 * Approve/Reject buttons for a single pending booking request. Client
 * sub-component since these need onClick interactivity inside an
 * otherwise server-rendered dashboard page.
 */
export function BookingActionButtons({ bookingId }: { bookingId: string }) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setPending("approve");
    const result = await approveBookingAction(bookingId);
    setPending(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  async function handleReject() {
    setPending("reject");
    const result = await rejectBookingAction(bookingId);
    setPending(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pending !== null}
        onClick={handleApprove}
      >
        {pending === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending !== null}
        onClick={handleReject}
      >
        {pending === "reject" ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}
