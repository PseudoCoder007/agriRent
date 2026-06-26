import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import * as listingService from "@/lib/services/listing.service";

/**
 * Flat, unfiltered equipment browse list for farmers — no category or
 * location filters yet (EQUIP-05 search/filter is explicitly deferred to
 * Phase 2 per SKELETON.md). Server Component making a direct service-layer
 * call, no client-side fetch.
 */
export default async function BrowsePage() {
  const result = await listingService.getAllEquipment();
  const equipment = result.data ?? [];

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-medium">Browse equipment</h1>

      {!result.success ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : equipment.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No equipment listings yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => {
            const firstImage = item.equipment_images[0];
            return (
              <Link key={item.id} href={`/equipment/${item.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/30">
                  <CardHeader>
                    <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {firstImage ? (
                        <Image
                          src={listingService.getEquipmentImageUrl(
                            firstImage.storage_path
                          )}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span>{item.title}</span>
                      <Badge variant="secondary">{item.category}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      ₹{item.rate} / {item.rate_unit}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Owner: {item.users?.full_name ?? "Unknown"}
                    </p>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
