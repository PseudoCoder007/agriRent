import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import * as listingService from "@/lib/services/listing.service";
import { EditEquipmentForm } from "./EditEquipmentForm";
import { DeleteEquipmentButton } from "./DeleteEquipmentButton";

export default async function EditEquipmentPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const result = await listingService.getEquipmentById(id);
  const equipment = result.data;

  if (!equipment) {
    notFound();
  }

  if (equipment.owner_id !== userData.user.id) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <EditEquipmentForm equipment={equipment} />
        <DeleteEquipmentButton equipmentId={equipment.id} />
      </div>
    </div>
  );
}
