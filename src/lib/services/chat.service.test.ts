import { describe, expect, it, vi } from "vitest";

/**
 * chat.service.ts's getChatHistory()/saveChatMessage() talk to Supabase via
 * src/lib/supabase/server.ts's createClient(). We mock that module so we can
 * drive specific success/error responses without a real Supabase project.
 *
 * Mirrors auth.service.test.ts's vi.mock("@/lib/supabase/server", ...)
 * pattern (see 02.1-01-PLAN.md Task 3 read_first).
 */

function makeFakeSupabaseHistory({
  data,
  error,
}: {
  data?: unknown[] | null;
  error?: { message: string; code?: string } | null;
}) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: data ?? null,
            error: error ?? null,
          }),
        })),
      })),
    })),
  };
}

function makeFakeSupabaseSave({
  data,
  error,
}: {
  data?: unknown | null;
  error?: { message: string; code?: string } | null;
}) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: data ?? null,
            error: error ?? null,
          }),
        })),
      })),
    })),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const userId = "11111111-1111-1111-1111-111111111111";

describe("getChatHistory", () => {
  it("returns ordered chat history on success", async () => {
    const rows = [
      { id: "a", user_id: userId, role: "user", content: "hi", created_at: "2026-01-01T00:00:00Z" },
      { id: "b", user_id: userId, role: "assistant", content: "hello", created_at: "2026-01-01T00:00:01Z" },
    ];
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseHistory({ data: rows, error: null })
    );

    const { getChatHistory } = await import("./chat.service");
    const result = await getChatHistory(userId);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Chat history loaded");
    expect(result.data).toEqual(rows);
  });

  it("logs and returns a failure result on Supabase query error", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseHistory({
        data: null,
        error: { message: "connection failed", code: "500" },
      })
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getChatHistory } = await import("./chat.service");
    const result = await getChatHistory(userId);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toBe("Could not load chat history");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "chat.service.getChatHistory: query failed",
      expect.objectContaining({ code: "500" })
    );

    consoleErrorSpy.mockRestore();
  });
});

describe("saveChatMessage", () => {
  it("inserts and returns the saved row on success", async () => {
    const row = {
      id: "c",
      user_id: userId,
      role: "user",
      content: "hi",
      created_at: "2026-01-01T00:00:00Z",
    };
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseSave({ data: row, error: null })
    );

    const { saveChatMessage } = await import("./chat.service");
    const result = await saveChatMessage(userId, "user", "hi");

    expect(result.success).toBe(true);
    expect(result.message).toBe("Message saved");
    expect(result.data).toEqual(row);
  });

  it("logs and returns a failure result on insert error", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseSave({
        data: null,
        error: { message: "insert failed", code: "23505" },
      })
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { saveChatMessage } = await import("./chat.service");
    const result = await saveChatMessage(userId, "assistant", "hello");

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toBe("Could not save chat message");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "chat.service.saveChatMessage: insert failed",
      expect.objectContaining({ code: "23505" })
    );

    consoleErrorSpy.mockRestore();
  });

  it("logs and returns a failure result when no error but no data is returned", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFakeSupabaseSave({ data: null, error: null })
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { saveChatMessage } = await import("./chat.service");
    const result = await saveChatMessage(userId, "user", "hi");

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toBe("Could not save chat message");

    consoleErrorSpy.mockRestore();
  });
});
