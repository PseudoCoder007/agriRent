import OpenAI from "openai";

/**
 * SERVER-ONLY. This file reads process.env.NVIDIA_API_KEY and must never be
 * imported by a Client Component ('use client' file) — the only network
 * boundary the browser ever talks to is /api/chat (see route.ts), never
 * NVIDIA directly. See 01-04-PLAN.md threat T-04-01.
 */

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

/**
 * Single source of truth for the NVIDIA NIM model name. Treat as
 * configuration, not a literal repeated across files, per PITFALLS.md
 * Pitfall 5 — the originally-requested model (minimax-m2.5) went EOL
 * (HTTP 410) without notice.
 */
export const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content:
    "You are the AgriRent assistant, a helpful FAQ chatbot for a farm " +
    "equipment rental marketplace. You can answer general questions about " +
    "how booking and rental works on AgriRent: farmers search and request " +
    "equipment for a date range, owners approve or reject requests, and " +
    "pricing is calculated from the equipment's listed hourly/daily rate. " +
    "You do NOT have access to live booking, equipment, or account data, " +
    "and you CANNOT create, modify, approve, or cancel bookings or " +
    "listings on the user's behalf — for anything account-specific, tell " +
    "the user to use the app's dashboard. Keep answers concise and friendly.",
};

/** Bounded history per PITFALLS.md Pitfall 5 — never accumulate unbounded turns. */
const MAX_HISTORY_TURNS = 10;
const MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = [500, 1500];
const FALLBACK_MESSAGE =
  "The assistant is busy right now, please try again in a moment.";

function isRetryableStatus(status: unknown): boolean {
  return typeof status === "number" && (status === 429 || status >= 500);
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

let cachedClient: OpenAI | null = null;

function getDefaultClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
    });
  }
  return cachedClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MinimalOpenAIClient = {
  chat: {
    completions: {
      create: (params: unknown) => Promise<unknown>;
    };
  };
};

/**
 * Wraps the NVIDIA NIM (OpenAI-compatible) chat completions call with:
 * - a fixed FAQ-only system prompt prepended to every request
 * - bounded conversation history (last MAX_HISTORY_TURNS turns)
 * - retry with exponential backoff (capped at MAX_RETRIES) on 429/5xx
 * - a generic friendly fallback on exhausted retries — never the raw
 *   provider error body or API key value (see T-04-04)
 *
 * `client` and `options.backoffMs` are injectable for unit testing only;
 * production callers should omit both and rely on the defaults.
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  client?: MinimalOpenAIClient,
  options?: { backoffMs?: number[] }
): Promise<ServiceResult<AsyncIterable<unknown>>> {
  const activeClient = client ?? (getDefaultClient() as unknown as MinimalOpenAIClient);
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;

  const truncatedHistory = messages.slice(-MAX_HISTORY_TURNS);
  const outgoingMessages = [SYSTEM_PROMPT, ...truncatedHistory];

  let attempt = 0;
  // attempt 0 = first try, attempts 1..MAX_RETRIES = retries
  while (attempt <= MAX_RETRIES) {
    try {
      const stream = await activeClient.chat.completions.create({
        model: NVIDIA_MODEL,
        messages: outgoingMessages,
        stream: true,
      });
      return {
        success: true,
        message: "",
        data: stream as AsyncIterable<unknown>,
      };
    } catch (error) {
      const status = getErrorStatus(error);
      const canRetry = isRetryableStatus(status) && attempt < MAX_RETRIES;

      if (!canRetry) {
        console.error(
          "ai.service.getChatCompletion: NVIDIA NIM call failed",
          status ?? "unknown status"
        );
        return {
          success: false,
          message: FALLBACK_MESSAGE,
          data: null,
        };
      }

      await sleep(backoffMs[attempt] ?? backoffMs[backoffMs.length - 1] ?? 0);
      attempt += 1;
    }
  }

  // Unreachable, but keeps TypeScript satisfied about a return on every path.
  return { success: false, message: FALLBACK_MESSAGE, data: null };
}
