import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { createClient } from "@/lib/supabase/server";
import * as favoritesService from "@/lib/services/favorites.service";
import { getEquipmentImageUrl } from "@/lib/services/listing.service";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const result = await favoritesService.getFavoritesForFarmer(userData.user.id);
  const favorites = result.data ?? [];

  return (
    <PageShell title="My Favorites" subtitle="Equipment you've saved for quick access">
      {!result.success ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Browse equipment and tap the heart icon to save listings here."
          action={
            <Link
              href="/browse"
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Browse equipment
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const eq = fav.equipments;
            if (!eq) return null;
            const firstImage = eq.equipment_images?.[0];
            return (
              <Link key={fav.id} href={`/equipment/${eq.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/30">
                  <CardHeader>
                    <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {firstImage ? (
                        <Image
                          src={getEquipmentImageUrl(firstImage.storage_path)}
                          alt={eq.title}
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
                      <span>{eq.title}</span>
                      <Badge variant="secondary">{eq.category}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      ₹{eq.rate} / {eq.rate_unit}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Owner: {eq.users?.full_name ?? "Unknown"}
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
