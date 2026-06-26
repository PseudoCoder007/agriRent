import { describe, expect, it } from "vitest";
import { createBookingSchema } from "./booking.schema";

describe("createBookingSchema", () => {
  it("accepts a valid booking request payload", () => {
    const result = createBookingSchema.safeParse({
      equipmentId: "123e4567-e89b-12d3-a456-426614174000",
      startDate: "2026-07-01",
      endDate: "2026-07-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload carrying extra total_amount/status fields (tamper signal)", () => {
    const result = createBookingSchema.safeParse({
      equipmentId: "123e4567-e89b-12d3-a456-426614174000",
      startDate: "2026-07-01",
      endDate: "2026-07-03",
      total_amount: 1,
      status: "approved",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // .strict() failure — no .data with stripped/extra keys is produced
      expect(result.data).toBeUndefined();
    }
  });

  it("rejects an invalid uuid and invalid dates", () => {
    const result = createBookingSchema.safeParse({
      equipmentId: "not-a-uuid",
      startDate: "invalid-date",
      endDate: "2026-07-03",
    });
    expect(result.success).toBe(false);
  });
});
