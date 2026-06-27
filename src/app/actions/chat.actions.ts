"use server";

import { createClient } from "@/lib/supabase/server";
import * as chatService from "@/lib/services/chat.service";
import { saveChatMessageSchema } from "@/lib/validations/chat.schema";

type ActionResult = {
  success: boolean;
  message: string;
  data: unknown;
};

/**
 * Persists one chat turn (user message or assistant reply) for the
 * authenticated user. No revalidatePath call -- chat history isn't rendered
 * by any other Server Component besides the chat page itself, and that page
 * already re-fetches on navigation/reload (the whole point of
 * CHAT-PERSIST-01).
 */
export async function saveChatMessageAction(
  role: "user" | "assistant",
  content: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { success: false, message: "You must be logged in.", data: null };
  }

  const parsed = saveChatMessageSchema.safeParse({ role, content });
  if (!parsed.success) {
    return { success: false, message: "Invalid chat message", data: null };
  }

  return chatService.saveChatMessage(
    userData.user.id,
    parsed.data.role,
    parsed.data.content
  );
}

/**
 * Loads the authenticated user's chat history, ordered oldest-first.
 */
export async function getChatHistoryAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { success: false, message: "You must be logged in.", data: null };
  }

  return chatService.getChatHistory(userData.user.id);
}
