import { describe, expect, it, vi } from "vitest";

type FakeUserRow = {
  role: "owner" | "farmer";
  full_name: string;
};

type FakeEquipmentRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  rate: number;
  rate_unit: string;
  location: string | null;
  deleted_at: string | null;
  created_at: string;
};

type FakeImageRow = {
  id: string;
  equipment_id: string;
  storage_path: string;
};

function makeFakeSupabase() {
  const state = {
    users: new Map<string, FakeUserRow>(),
    equipments: [] as FakeEquipmentRow[],
    equipmentImages: [] as FakeImageRow[],
    uploads: [] as string[],
    nextEquipmentId: 1,
    nextImageId: 1,
  };

  state.users.set("owner-1", {
    role: "owner",
    full_name: "Test Owner",
  });

  const fromMock = vi.fn((table: string) => {
    if (table === "users") {
      return {
        select: () => ({
          eq: (column: string, value: string) => ({
            single: async () => {
              if (column !== "id") {
                throw new Error(`Unexpected users filter: ${column}`);
              }

              const row = state.users.get(value) ?? null;

              return {
                data: row,
                error: row ? null : { message: "not found" },
              };
            },
          }),
        }),
      };
    }

    if (table === "equipments") {
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              const row: FakeEquipmentRow = {
                id: `equipment-${state.nextEquipmentId++}`,
                owner_id: String(payload.owner_id),
                title: String(payload.title),
                description:
                  payload.description === undefined
                    ? null
                    : String(payload.description),
                category: String(payload.category),
                rate: Number(payload.rate),
                rate_unit: String(payload.rate_unit),
                location:
                  payload.location === undefined
                    ? null
                    : String(payload.location),
                deleted_at: null,
                created_at: new Date(
                  Date.UTC(2026, 0, state.nextEquipmentId)
                ).toISOString(),
              };

              state.equipments.push(row);

              return {
                data: row,
                error: null,
              };
            },
          }),
        }),
        select: () => ({
          eq: (column: string, value: string) => ({
            single: async () => {
              if (column !== "id") {
                throw new Error(`Unexpected equipment single filter: ${column}`);
              }

              const row = state.equipments.find((item) => item.id === value) ?? null;

              return {
                data: row,
                error: row ? null : { message: "not found" },
              };
            },
            order: async () => {
              const rows = state.equipments
                .filter((item) => item.owner_id === value)
                .slice()
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((item) => ({
                  ...item,
                  equipment_images: state.equipmentImages
                    .filter((image) => image.equipment_id === item.id)
                    .map((image) => ({
                      id: image.id,
                      storage_path: image.storage_path,
                    })),
                  users: state.users.get(item.owner_id)
                    ? {
                        full_name: state.users.get(item.owner_id)!.full_name,
                      }
                    : null,
                }));

              return {
                data: rows,
                error: null,
              };
            },
          }),
        }),
      };
    }

    if (table === "equipment_images") {
      return {
        insert: (payload: Record<string, unknown>) => ({
          error: (() => {
            const row: FakeImageRow = {
              id: `image-${state.nextImageId++}`,
              equipment_id: String(payload.equipment_id),
              storage_path: String(payload.storage_path),
            };

            state.equipmentImages.push(row);

            return null;
          })(),
        }),
      };
    }

    throw new Error(`Unexpected table in test mock: ${table}`);
  });

  return {
    state,
    from: fromMock,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (storagePath: string) => {
          state.uploads.push(storagePath);
          return { error: null };
        }),
      })),
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("listing.service multi-listing regression", () => {
  it("allows the same owner to create multiple equipment listings and read them all back", async () => {
    const fakeSupabase = makeFakeSupabase();
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeSupabase
    );

    const { createEquipment, getEquipmentByOwner } = await import("./listing.service");

    const firstResult = await createEquipment(
      {
        title: "Tractor A",
        description: "First listing",
        category: "Tractor",
        rate: 1500,
        rateUnit: "day",
        location: "Pune",
      },
      "owner-1",
      {
        name: "tractor-a.jpg",
        size: 1024,
        type: "image/jpeg",
      } as File
    );

    const secondResult = await createEquipment(
      {
        title: "Harvester B",
        description: "Second listing",
        category: "Harvester",
        rate: 2200,
        rateUnit: "day",
        location: "Nashik",
      },
      "owner-1",
      {
        name: "harvester-b.jpg",
        size: 1024,
        type: "image/jpeg",
      } as File
    );

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);

    const ownerListings = await getEquipmentByOwner("owner-1");

    expect(ownerListings.success).toBe(true);
    expect(ownerListings.data).toHaveLength(2);
    expect(ownerListings.data?.map((item) => item.title)).toEqual([
      "Harvester B",
      "Tractor A",
    ]);
    expect(ownerListings.data?.every((item) => item.equipment_images.length === 1)).toBe(
      true
    );
    expect(fakeSupabase.state.uploads).toEqual([
      "owner-1/equipment-1/tractor-a.jpg",
      "owner-1/equipment-2/harvester-b.jpg",
    ]);
  });
});
