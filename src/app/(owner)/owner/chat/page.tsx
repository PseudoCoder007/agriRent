import { createClient } from "@/lib/supabase/server";
import * as chatService from "@/lib/services/chat.service";
import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Dedicated /owner/chat route per D-04 (not a floating widget). Rendered
 * inside (owner)/layout.tsx so logout/nav remain visible.
 */
export default async function OwnerChatPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const rows = userData.user
    ? (await chatService.getChatHistory(userData.user.id)).data ?? []
    : [];
  const history = rows.map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
  }));

  return (
    <div className="p-4">
      <ChatWidget initialMessages={history} />
    </div>
  );
}
