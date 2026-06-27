import { createClient } from "@/lib/supabase/server";
import * as reviewService from "@/lib/services/review.service";
import { ReviewForm } from "./ReviewForm";

export async function ReviewSection({
  equipmentId,
}: {
  equipmentId: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const [reviewsResult, avgResult] = await Promise.all([
    reviewService.getReviewsForEquipment(equipmentId),
    reviewService.getAverageRating(equipmentId),
  ]);

  const reviews = reviewsResult.data ?? [];
  const average = avgResult.data;

  let eligibleBooking: { bookingId: string } | null = null;

  if (userData?.user) {
    const eligibleResult = await reviewService.getEligibleBooking(
      userData.user.id,
      equipmentId
    );
    if (eligibleResult.success && eligibleResult.data) {
      eligibleBooking = eligibleResult.data;
    }
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Reviews</h2>
        {average !== null ? (
          <span className="text-sm text-muted-foreground">
            ★ {average.toFixed(1)} ({reviews.length})
          </span>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews yet.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-md border p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {review.users?.full_name ?? "Anonymous"}
                </span>
                <span className="text-yellow-500">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment ? (
                <p className="mt-1 text-muted-foreground">
                  {review.comment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {eligibleBooking ? (
        <div className="rounded-md border p-4">
          <h3 className="mb-3 text-sm font-medium">
            Review this equipment
          </h3>
          <ReviewForm
            bookingId={eligibleBooking.bookingId}
            equipmentId={equipmentId}
          />
        </div>
      ) : null}
    </section>
  );
}
