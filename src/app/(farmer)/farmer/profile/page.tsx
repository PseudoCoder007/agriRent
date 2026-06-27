import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { PageShell } from "@/components/ui/page-shell";
import { createClient } from "@/lib/supabase/server";

/**
 * Farmer-facing profile page. Mirrors the owner profile page's structure
 * exactly (UI-SPEC: "both render identical UI"). Role guard mirrors the
 * existing (farmer)/layout.tsx pattern — role is read only from
 * public.users, never from Auth metadata.
 */
export default async function FarmerProfilePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, avatar_url, role, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

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
      />
    </PageShell>
  );
}
