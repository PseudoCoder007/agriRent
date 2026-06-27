"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  completeBookingAction,
  cancelBookingAction,
} from "@/app/actions/booking.actions";
import { Button } from "@/components/ui/button";

export function CompleteCancelButtons({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [pending, setPending] = useState<string | null>(null);

  async function handleComplete() {
    setPending("complete");
    const result = await completeBookingAction(bookingId);
    setPending(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  async function handleCancel() {
    setPending("cancel");
    const result = await cancelBookingAction(bookingId);
    setPending(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  const showComplete = status === "approved";
  const showCancel = status === "pending" || status === "approved";

  return (
    <div className="flex gap-2">
      {showComplete ? (
        <Button
          type="button"
          size="sm"
          disabled={pending !== null}
          onClick={handleComplete}
        >
          {pending === "complete" ? "Completing..." : "Mark Completed"}
        </Button>
      ) : null}
      {showCancel ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={handleCancel}
        >
          {pending === "cancel" ? "Cancelling..." : "Cancel"}
        </Button>
      ) : null}
    </div>
  );
}
