import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { PageShell } from "@/components/ui/page-shell";
import { getAvatarUrl } from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-facing profile page. Mirrors the farmer profile page's structure
 * exactly (UI-SPEC: "both render identical UI"). Role guard mirrors the
 * existing (owner)/layout.tsx pattern — role is read only from
 * public.users, never from Auth metadata.
 */
export default async function OwnerProfilePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, avatar_url, avatar_updated_at, role, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const avatarUrl = profile.avatar_url
    ? getAvatarUrl(profile.avatar_url, profile.avatar_updated_at)
    : null;

  return (
    <PageShell
      title="Profile"
      subtitle="Manage your name, photo, and contact details"
    >
      <ProfileForm
        initialFullName={profile.full_name ?? ""}
        initialPhone={profile.phone}
        email={userData.user.email ?? profile.email}
        role={profile.role === "owner" ? "owner" : "farmer"}
        avatarUrl={avatarUrl}
      />
    </PageShell>
  );
}
