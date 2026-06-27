import { PackageSearch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { EquipmentFilterBar } from "@/components/equipment/equipment-filter-bar";
import * as listingService from "@/lib/services/listing.service";

/**
 * Server-side filtered equipment browse list for farmers. Category uses
 * exact match; location uses case-insensitive substring match (ILIKE).
 * Both filters are applied server-side via the Supabase query builder in
 * listing.service.ts — never client-side array filtering.
 */
export default async function BrowsePage(props: {
  searchParams: Promise<{ category?: string; location?: string }>;
}) {
  const { category, location } = await props.searchParams;
  const result = await listingService.getAllEquipment({ category, location });
  const equipment = result.data ?? [];

  return (
    <PageShell title="Browse equipment" subtitle="Find the equipment you need for your farm">
      <EquipmentFilterBar
        currentCategory={category}
        currentLocation={location}
      />

      {!result.success ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No equipment found"
          description={
            category || location
              ? "Try adjusting your filters to see more results."
              : "No equipment listings yet. Check back soon."
          }
        />
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
    </PageShell>
  );
}
