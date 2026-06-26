import { describe, expect, it } from "vitest";
import { createEquipmentSchema, imageFileSchema } from "./equipment.schema";

describe("createEquipmentSchema", () => {
  it("accepts a valid equipment payload", () => {
    const result = createEquipmentSchema.safeParse({
      title: "John Deere 5050D",
      description: "Good tractor",
      category: "Tractor",
      rate: 1500,
      rateUnit: "day",
    });
    expect(result.success).toBe(true);
  });

  it("fails with field errors for empty title, invalid category, and negative rate", () => {
    const result = createEquipmentSchema.safeParse({
      title: "",
      category: "Bulldozer",
      rate: -10,
      rateUnit: "day",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.title).toBeDefined();
      expect(fieldErrors.category).toBeDefined();
      expect(fieldErrors.rate).toBeDefined();
    }
  });

  it("rejects a category value outside the fixed 6-value enum", () => {
    const result = createEquipmentSchema.safeParse({
      title: "Combine harvester",
      category: "Combine",
      rate: 2000,
      rateUnit: "day",
    });
    expect(result.success).toBe(false);
  });

  it("fails when rate is missing", () => {
    const result = createEquipmentSchema.safeParse({
      title: "John Deere 5050D",
      category: "Tractor",
      rateUnit: "day",
    });
    expect(result.success).toBe(false);
  });
});

describe("imageFileSchema", () => {
  it("accepts a valid JPEG under the 5MB cap", () => {
    const result = imageFileSchema.safeParse({
      size: 1024 * 1024,
      type: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a file over the 5MB cap", () => {
    const result = imageFileSchema.safeParse({
      size: 6 * 1024 * 1024,
      type: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a disallowed MIME type", () => {
    const result = imageFileSchema.safeParse({
      size: 1024,
      type: "application/x-msdownload",
    });
    expect(result.success).toBe(false);
  });
});
