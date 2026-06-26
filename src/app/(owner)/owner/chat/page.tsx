import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Dedicated /owner/chat route per D-04 (not a floating widget). Rendered
 * inside (owner)/layout.tsx so logout/nav remain visible.
 */
export default function OwnerChatPage() {
  return (
    <div className="p-4">
      <ChatWidget />
    </div>
  );
}
