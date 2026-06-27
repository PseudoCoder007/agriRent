"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { updateEquipmentAction } from "@/app/actions/listing.actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EquipmentWithOwnerAndImages } from "@/lib/services/listing.service";
import { updateEquipmentSchema } from "@/lib/validations/equipment.schema";

const CATEGORIES = [
  "Tractor",
  "Harvester",
  "Plough",
  "Rotavator",
  "Sprayer",
  "Other",
] as const;

type FormValues = z.input<typeof updateEquipmentSchema>;

export function EditEquipmentForm({
  equipment,
}: {
  equipment: EquipmentWithOwnerAndImages;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateEquipmentSchema),
    defaultValues: {
      title: equipment.title,
      description: equipment.description ?? "",
      category: equipment.category as FormValues["category"],
      rate: equipment.rate,
      rateUnit: equipment.rate_unit as FormValues["rateUnit"],
      location: equipment.location ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const formData = new FormData();
    formData.set("title", values.title ?? equipment.title);
    formData.set("description", values.description ?? "");
    formData.set("category", values.category ?? equipment.category);
    formData.set("rate", String(values.rate ?? equipment.rate));
    formData.set("rateUnit", values.rateUnit ?? equipment.rate_unit);
    formData.set("location", values.location ?? "");

    const result = await updateEquipmentAction(equipment.id, formData);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    toast.success(result.message);
    router.push("/owner/dashboard");
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Edit equipment</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update your listing details.</p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="John Deere 5050D" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Well-maintained, available for daily rental"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1500"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rateUnit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Per</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hour">Hour</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nashik, Maharashtra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError ? (
              <p className="text-sm text-destructive">{serverError}</p>
            ) : null}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : "Save changes"}
            </Button>
          </form>
        </Form>
    </div>
  );
}
