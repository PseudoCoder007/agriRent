"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createEquipmentAction } from "@/app/actions/listing.actions";
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
import { createEquipmentSchema } from "@/lib/validations/equipment.schema";

const CATEGORIES = [
  "Tractor",
  "Harvester",
  "Plough",
  "Rotavator",
  "Sprayer",
  "Other",
] as const;

// Form values use the schema's *input* shape (z.input), not its inferred
// output (z.infer) — `rate` is a z.coerce.number() field, so its input
// type is `string | number` (whatever the <input type="number"> control
// produces) while its parsed output type is `number`. Using z.infer here
// would make react-hook-form's typed `field.value`/`onChange` disagree
// with zodResolver's expected input type.
type EquipmentFormValues = z.input<typeof createEquipmentSchema>;

export default function NewEquipmentPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Tractor",
      rate: 0,
      rateUnit: "day",
      location: "",
    },
  });

  async function onSubmit(values: EquipmentFormValues) {
    setServerError(null);
    setImageError(null);

    if (!imageFile) {
      setImageError("Please select a photo to upload.");
      return;
    }

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description ?? "");
    formData.set("category", values.category);
    formData.set("rate", String(values.rate));
    formData.set("rateUnit", values.rateUnit);
    formData.set("location", values.location ?? "");
    formData.set("image", imageFile);

    const result = await createEquipmentAction(formData);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    toast.success(result.message);
    router.push("/owner/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">List new equipment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a tractor or machine for farmers to discover and book.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
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

              <div className="grid gap-2">
                <label htmlFor="image" className="text-sm font-medium">
                  Photo
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                {imageError ? (
                  <p className="text-sm text-destructive">{imageError}</p>
                ) : null}
              </div>

              {serverError ? (
                <p className="text-sm text-destructive">{serverError}</p>
              ) : null}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Creating listing..."
                  : "Create listing"}
              </Button>
            </form>
          </Form>
        </div>
    </div>
  );
}
