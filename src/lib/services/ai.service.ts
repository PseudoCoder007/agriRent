import OpenAI from "openai";

import * as listingService from "@/lib/services/listing.service";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

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
 * Builds a dynamic system prompt with live marketplace context so the AI
 * can give grounded recommendations. Called once per conversation turn
 * (data is cached per request — not per user session).
 */
async function buildSystemPrompt(): Promise<string> {
  const listingResult = await listingService.getAllEquipment();
  const listings = listingResult.data ?? [];

  const categoryCounts: Record<string, number> = {};
  for (const l of listings) {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
  }

  const categorySummary = Object.entries(categoryCounts)
    .map(([cat, count]) => `${count}x ${cat}`)
    .join(", ");

  const sampleListings = listings.slice(0, 5).map(
    (l) =>
      `- ${l.title} (${l.category}, ₹${l.rate}/${l.rate_unit}${l.location ? `, ${l.location}` : ""})`
  );

  return (
    "You are the AgriRent assistant for a farm equipment rental marketplace. " +
    "Your role is to help farmers find equipment and help owners understand the platform. " +
    "You can answer questions about how bookings work, suggest what to search for, " +
    "and give recommendations based on the available listings.\n\n" +
    "--- LIVE MARKETPLACE DATA ---\n" +
    `Listings available: ${listings.length}\n` +
    `Available categories: ${categorySummary || "None yet"}\n` +
    `Recent listings:\n${sampleListings.join("\n") || "No listings yet"}\n` +
    "---\n\n" +
    "Rules:\n" +
    "- Use the marketplace data above to give specific, grounded recommendations.\n" +
    "- If a farmer asks about equipment, suggest what's actually available.\n" +
    "- Do NOT make up equipment, prices, or availability.\n" +
    "- Do NOT create, modify, approve, or cancel bookings or listings.\n" +
    "- For account-specific actions (bookings, listings), tell the user to use the dashboard.\n" +
    "- Keep answers concise and friendly."
  );
}

/**
 * Returns a streaming chat completion with a dynamically-generated system
 * prompt that includes live marketplace data. The FAQ-only system prompt
 * is replaced with a recommendation-capable one.
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  client?: MinimalOpenAIClient,
  options?: { backoffMs?: number[] }
): Promise<ServiceResult<AsyncIterable<unknown>>> {
  const activeClient =
    client ?? (getDefaultClient() as unknown as MinimalOpenAIClient);
  const backoffMs = options?.backoffMs ?? DEFAULT_BACKOFF_MS;

  const truncatedHistory = messages.slice(-MAX_HISTORY_TURNS);
  const systemMessage: ChatMessage = {
    role: "system",
    content: await buildSystemPrompt(),
  };
  const outgoingMessages = [systemMessage, ...truncatedHistory];

  let attempt = 0;
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

      await sleep(
        backoffMs[attempt] ?? backoffMs[backoffMs.length - 1] ?? 0
      );
      attempt += 1;
    }
  }

  return { success: false, message: FALLBACK_MESSAGE, data: null };
}
