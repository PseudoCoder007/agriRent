"use client";

import { useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { createBookingAction } from "@/app/actions/booking.actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

/**
 * Booking-request form embedded on the equipment detail page. The shown
 * total is a client-side estimate ONLY, for UX — the actual stored
 * total_amount is always recomputed server-side from the equipment's
 * stored rate (see booking.service.ts createBooking and PITFALLS.md's
 * warning on this exact estimate/actual mismatch risk). On a friendly
 * "dates no longer available" failure, the message is surfaced inline,
 * not as an unhandled error.
 */
export function BookingRequestForm({
  equipmentId,
  rate,
  rateUnit,
}: {
  equipmentId: string;
  rate: number;
  rateUnit: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const durationInUnits =
    range?.from && range?.to
      ? Math.max(differenceInCalendarDays(range.to, range.from) + 1, 1)
      : 0;
  const estimatedTotal = durationInUnits * rate;

  async function handleSubmit() {
    if (!range?.from || !range?.to) {
      setErrorMessage("Please select a start and end date.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("equipmentId", equipmentId);
    formData.set("startDate", format(range.from, "yyyy-MM-dd"));
    formData.set("endDate", format(range.to, "yyyy-MM-dd"));

    const result = await createBookingAction(formData);
    setSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    toast.success(result.message);
    setRange(undefined);
  }

  return (
    <div className="mt-6 rounded-md border p-4">
      <h2 className="text-sm font-medium">Request a booking</h2>

      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={{ before: new Date() }}
        className="mt-2"
      />

      {durationInUnits > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Estimate: {durationInUnits} {rateUnit}
          {durationInUnits > 1 ? "s" : ""} x ₹{rate} = ₹{estimatedTotal}{" "}
          <span className="italic">
            (estimate only — final amount is confirmed by the server)
          </span>
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <Button
        type="button"
        className="mt-3"
        disabled={submitting || !range?.from || !range?.to}
        onClick={handleSubmit}
      >
        {submitting ? "Requesting..." : "Request booking"}
      </Button>
    </div>
  );
}
