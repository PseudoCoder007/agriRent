"use client";

import { useState } from "react";
import { toast } from "sonner";

import { toggleFavoriteAction } from "@/app/actions/favorites.actions";
import { Toggle } from "@/components/ui/toggle";
import { Heart } from "lucide-react";

export function FavoriteButton({
  equipmentId,
  initialFavorited,
}: {
  equipmentId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);

  async function handleToggle() {
    const previous = favorited;
    setFavorited(!favorited);

    const result = await toggleFavoriteAction(equipmentId);

    if (!result.success) {
      setFavorited(previous);
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
  }

  return (
    <Toggle pressed={favorited} onPressedChange={handleToggle} aria-label="Toggle favorite">
      <Heart className={`h-5 w-5 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
    </Toggle>
  );
}
