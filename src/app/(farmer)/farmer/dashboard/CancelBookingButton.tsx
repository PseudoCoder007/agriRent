"use client";

import { useState } from "react";
import { toast } from "sonner";

import { cancelBookingAction } from "@/app/actions/booking.actions";
import { Button } from "@/components/ui/button";

export function CancelBookingButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    setPending(true);
    const result = await cancelBookingAction(bookingId);
    setPending(false);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={handleCancel}
    >
      {pending ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
