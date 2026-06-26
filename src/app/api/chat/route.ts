import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getChatCompletion, type ChatMessage } from "@/lib/services/ai.service";

/**
 * Explicit, generous duration for this route only — LLM calls are the
 * slowest part of this stack (see PITFALLS.md Pitfall 4). Other routes
 * (booking CRUD) intentionally keep low defaults; a stuck booking route
 * hints at a bug, not normal latency.
 */
export const maxDuration = 60;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .min(1),
});

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message, data: null }, { status });
}

/**
 * POST /api/chat — the AI layer's single external-facing entry point
 * (ARCHITECTURE.md Pattern 1). Requires an authenticated session (either
 * role — farmer or owner) but does not branch behavior by role; the
 * chatbot is FAQ-only and never touches bookings/equipments.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return jsonError("You must be logged in to use the chatbot.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request: messages array is required.", 400);
  }

  const messages = parsed.data.messages as ChatMessage[];
  const latest = messages[messages.length - 1];
  if (latest.role !== "user" || latest.content.trim().length === 0) {
    return jsonError(
      "Invalid request: the latest message must be a non-empty user message.",
      400
    );
  }

  const result = await getChatCompletion(messages);

  if (!result.success || !result.data) {
    return jsonError(result.message, 503);
  }

  const completionStream = result.data;

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completionStream as AsyncIterable<{
          choices?: { delta?: { content?: string } }[];
        }>) {
          const token = chunk.choices?.[0]?.delta?.content ?? "";
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        }
      } catch (error) {
        console.error("api/chat: error while streaming completion", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
