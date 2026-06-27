"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { uploadAvatarAction } from "@/app/actions/profile.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type AvatarUploadProps = {
  currentAvatarUrl: string | null;
  fallbackInitial: string;
};

/**
 * Hidden native file input + "Change photo" button (no Dialog, per
 * UI-SPEC). All upload logic happens through uploadAvatarAction — this
 * component never calls supabase.storage directly. On success, calls
 * router.refresh() so the parent Server Component page re-fetches
 * avatar_url/avatar_updated_at and passes a freshly cache-busted URL back
 * down via getAvatarUrl.
 */
export function AvatarUpload({
  currentAvatarUrl,
  fallbackInitial,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatarAction(formData);

      if (result.success) {
        toast.success("Profile photo updated");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="size-24">
        <AvatarImage src={currentAvatarUrl ?? undefined} />
        <AvatarFallback>{fallbackInitial}</AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Change photo"}
      </Button>
    </div>
  );
}
