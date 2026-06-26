import { describe, expect, it, vi } from "vitest";

/**
 * booking.service.ts's createBooking talks to Supabase via
 * src/lib/supabase/server.ts's createClient(). We mock that module so we
 * can drive specific success/error responses (including a Postgres
 * 23P01 exclusion-violation) without a real database.
 */

function makeFakeSupabase({
  equipment,
  insertError,
  insertedBooking,
}: {
  equipment: { rate: number; rate_unit: string; owner_id: string } | null;
  insertError?: { code?: string; message?: string } | null;
  insertedBooking?: Record<string, unknown> | null;
}) {
  const fromMock = vi.fn((table: string) => {
    if (table === "equipments") {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: equipment,
                error: equipment ? null : { message: "not found" },
              }),
          }),
        }),
      };
    }

    if (table === "bookings") {
      return {
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: insertError ? null : insertedBooking,
                error: insertError ?? null,
              }),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table in test mock: ${table}`);
  });

  return { from: fromMock };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/notification.service", () => ({
  createNotification: vi.fn().mockResolvedValue({
    success: true,
    message: "Notification created",
    data: null,
  }),
}));

describe("createBooking", () => {
  it("returns a friendly message (not a thrown exception) when Postgres raises 23P01", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabase({
        equipment: { rate: 1000, rate_unit: "day", owner_id: "owner-1" },
        insertError: { code: "23P01", message: "exclusion violation" },
      })
    );

    const { createBooking } = await import("./booking.service");

    const result = await createBooking(
      {
        equipmentId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "2026-07-01",
        endDate: "2026-07-03",
      },
      "farmer-1"
    );

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message.toLowerCase()).toContain("no longer available");
    expect(result.message).not.toMatch(/23P01/);
  });

  it("computes total_amount as rate x duration from the server-fetched equipment rate, ignoring any price-like input", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabase({
        equipment: { rate: 1000, rate_unit: "day", owner_id: "owner-1" },
        insertedBooking: {
          id: "booking-1",
          equipment_id: "123e4567-e89b-12d3-a456-426614174000",
          farmer_id: "farmer-1",
          start_date: "2026-07-01",
          end_date: "2026-07-03",
          total_amount: 3000,
          status: "pending",
        },
      })
    );

    const { createBooking } = await import("./booking.service");

    const result = await createBooking(
      {
        equipmentId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "2026-07-01",
        endDate: "2026-07-03",
      },
      "farmer-1"
    );

    expect(result.success).toBe(true);
    expect(result.data?.total_amount).toBe(3000);
  });
});
