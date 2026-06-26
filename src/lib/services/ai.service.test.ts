import { describe, expect, it, vi } from "vitest";
import { getChatCompletion, type ChatMessage } from "./ai.service";

/**
 * ai.service.ts instantiates its own openai client internally, but
 * getChatCompletion accepts an optional injected client for testing —
 * this avoids needing a real NVIDIA_API_KEY or network call in unit tests
 * while keeping the production code path (no injected client) using the
 * real client built from process.env.NVIDIA_API_KEY.
 */

function makeFakeStream(content: string) {
  const chunks = content.split(" ").map((word, i) => ({
    choices: [{ delta: { content: (i === 0 ? "" : " ") + word } }],
  }));
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

function fakeApiError(status: number) {
  const err = new Error(`Request failed with status ${status}`);
  // The openai SDK attaches `.status` on API errors — mimic that shape.
  (err as Error & { status: number }).status = status;
  return err;
}

describe("getChatCompletion", () => {
  const messages: ChatMessage[] = [{ role: "user", content: "Hello" }];

  it("returns the model's streamed response content on success", async () => {
    const create = vi.fn().mockResolvedValue(makeFakeStream("Hi there"));
    const fakeClient = { chat: { completions: { create } } };

    const result = await getChatCompletion(messages, fakeClient as never);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("retries on 429 and succeeds on the third call", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(fakeApiError(429))
      .mockRejectedValueOnce(fakeApiError(429))
      .mockResolvedValueOnce(makeFakeStream("Recovered"));
    const fakeClient = { chat: { completions: { create } } };

    const result = await getChatCompletion(messages, fakeClient as never, {
      backoffMs: [0, 0],
    });

    expect(result.success).toBe(true);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it("exhausts retries on persistent 5xx and returns a friendly fallback, not the raw error", async () => {
    const create = vi.fn().mockRejectedValue(fakeApiError(503));
    const fakeClient = { chat: { completions: { create } } };

    const result = await getChatCompletion(messages, fakeClient as never, {
      backoffMs: [0, 0],
    });

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).not.toContain("503");
    expect(result.message).not.toContain("NVIDIA_API_KEY");
    expect(create).toHaveBeenCalledTimes(3);
  });

  it("truncates conversation history to the most recent 10 turns before sending", async () => {
    const longHistory: ChatMessage[] = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `turn ${i}`,
    }));
    const create = vi.fn().mockResolvedValue(makeFakeStream("ok"));
    const fakeClient = { chat: { completions: { create } } };

    await getChatCompletion(longHistory, fakeClient as never);

    const callArgs = create.mock.calls[0][0];
    // +1 for the prepended system prompt
    expect(callArgs.messages.length).toBeLessThanOrEqual(11);
  });
});
