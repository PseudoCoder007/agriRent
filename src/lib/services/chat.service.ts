import { createClient } from "@/lib/supabase/server";
import type { Tables } from "../../../types/database";

type ServiceResult<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type ChatMessageRow = Tables<"chat_messages">;

/**
 * Reads a user's own chat history. Uses the regular RLS-respecting server
 * client -- a user reading their own chat_messages is exactly what the
 * "chat_messages select own" SELECT policy from 0007_chat_messages.sql
 * already allows, so no admin-client bypass is needed here (unlike
 * notifications, chat never crosses users -- see RESEARCH.md Anti-Patterns).
 */
export async function getChatHistory(
  userId: string
): Promise<ServiceResult<ChatMessageRow[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("chat.service.getChatHistory: query failed", error);
    return { success: false, message: "Could not load chat history", data: null };
  }

  return { success: true, message: "Chat history loaded", data: data ?? [] };
}

/**
 * Saves one chat message (either the user's own typed message or the
 * assistant's completed reply) for the authenticated user. Always uses the
 * regular RLS-respecting server client -- the "chat_messages insert own"
 * policy only allows inserting rows attributed to the caller's own
 * auth.uid(), which matches every call site in this codebase.
 */
export async function saveChatMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<ServiceResult<ChatMessageRow>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, role, content })
    .select()
    .single();

  if (error || !data) {
    console.error("chat.service.saveChatMessage: insert failed", error);
    return { success: false, message: "Could not save chat message", data: null };
  }

  return { success: true, message: "Message saved", data };
}
