import Image from "next/image";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import * as favoritesService from "@/lib/services/favorites.service";
import * as listingService from "@/lib/services/listing.service";
import { ReviewSection } from "@/components/equipment/ReviewSection";
import { BookingRequestForm } from "./BookingRequestForm";
import { FavoriteButton } from "./FavoriteButton";

/**
 * Equipment detail page — photos, full description, category, rate, and
 * owner name. Server Component making a direct service-layer call.
 */
export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const [equipmentResult, favoritedResult] = await Promise.all([
    listingService.getEquipmentById(id),
    userData?.user
      ? favoritesService.isFavorited(userData.user.id, id)
      : Promise.resolve({ success: true, data: false } as const),
  ]);

  if (!equipmentResult.data) {
    notFound();
  }

  const equipment = equipmentResult.data;
  const initialFavorited = favoritedResult.data ?? false;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {equipment.equipment_images.length === 0 ? (
          <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
            No photos
          </div>
        ) : (
          equipment.equipment_images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-video overflow-hidden rounded-md bg-muted"
            >
              <Image
                src={listingService.getEquipmentImageUrl(image.storage_path)}
                alt={equipment.title}
                fill
                className="object-cover"
              />
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{equipment.title}</h1>
        <div className="flex items-center gap-2">
          <FavoriteButton
            equipmentId={equipment.id}
            initialFavorited={initialFavorited}
          />
          <Badge variant="secondary">{equipment.category}</Badge>
        </div>
      </div>

      <p className="mt-1 text-lg font-medium">
        ₹{equipment.rate} / {equipment.rate_unit}
      </p>

      {equipment.location ? (
        <p className="text-sm text-muted-foreground">{equipment.location}</p>
      ) : null}

      <p className="mt-4 text-sm text-muted-foreground">
        Owner: {equipment.users?.full_name ?? "Unknown"}
      </p>

      {equipment.description ? (
        <p className="mt-4 text-sm whitespace-pre-wrap">
          {equipment.description}
        </p>
      ) : null}

      <BookingRequestForm
        equipmentId={equipment.id}
        rate={Number(equipment.rate)}
        rateUnit={equipment.rate_unit}
      />

      <ReviewSection equipmentId={equipment.id} />
    </div>
  );
}
