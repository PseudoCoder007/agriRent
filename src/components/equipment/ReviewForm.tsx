"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createReviewAction } from "@/app/actions/review.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  bookingId,
  equipmentId,
}: {
  bookingId: string;
  equipmentId: string;
}) {
  const [rating, setRating] = useState(5);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (pending) return;

    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));
    formData.set("bookingId", bookingId);

    setPending(true);
    const result = await createReviewAction(formData);
    setPending(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="equipmentId" value={equipmentId} />
      <div>
        <Label>Rating</Label>
        <div className="flex gap-1 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`h-8 w-8 rounded text-lg ${
                star <= rating
                  ? "text-yellow-500"
                  : "text-muted-foreground"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="Share your experience with this equipment..."
          rows={3}
          maxLength={1000}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
