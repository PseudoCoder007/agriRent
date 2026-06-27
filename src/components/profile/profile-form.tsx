"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/actions/profile.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile.schema";

type ProfileFormProps = {
  initialFullName: string;
  initialPhone: string | null;
  email: string;
  role: "farmer" | "owner";
};

type FieldErrors = {
  fullName?: string[];
  phone?: string[];
};

function isFieldErrors(data: unknown): data is FieldErrors {
  return (
    typeof data === "object" &&
    data !== null &&
    ("fullName" in data || "phone" in data)
  );
}

export function ProfileForm({
  initialFullName,
  initialPhone,
  email,
  role,
}: ProfileFormProps) {
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialFullName,
      phone: initialPhone ?? "",
    },
  });

  async function onSubmit(values: UpdateProfileInput) {
    const result = await updateProfileAction(values);

    if (!result.success) {
      if (isFieldErrors(result.data)) {
        if (result.data.fullName?.[0]) {
          form.setError("fullName", { message: result.data.fullName[0] });
        }
        if (result.data.phone?.[0]) {
          form.setError("phone", { message: result.data.phone[0] });
        }
      } else {
        toast.error(result.message);
      }
      return;
    }

    toast.success("Profile updated");
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="items-center text-center">
        {/* Avatar block wired in 03.4-03 */}
        <Badge variant="secondary">
          {role === "owner" ? "Owner" : "Farmer"}
        </Badge>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Email
              </p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
