"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Tractor",
  "Harvester",
  "Plough",
  "Rotavator",
  "Sprayer",
  "Other",
] as const;

export function EquipmentFilterBar({
  currentCategory,
  currentLocation,
}: {
  currentCategory?: string;
  currentLocation?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Category
        </label>
        <Select
          value={currentCategory ?? ""}
          onValueChange={(v) =>
            updateParams("category", v === "all" || !v ? undefined : v)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Location
        </label>
        <Input
          placeholder="Search location..."
          defaultValue={currentLocation ?? ""}
          className="w-56"
          onBlur={(e) =>
            updateParams("location", e.target.value || undefined)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams(
                "location",
                (e.target as HTMLInputElement).value || undefined
              );
            }
          }}
        />
      </div>
    </div>
  );
}
