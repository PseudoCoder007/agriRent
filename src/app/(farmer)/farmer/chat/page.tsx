import { ChatWidget } from "@/components/chat/chat-widget";

/**
 * Dedicated /farmer/chat route per D-04 (not a floating widget). Rendered
 * inside (farmer)/layout.tsx so logout/nav remain visible.
 */
export default function FarmerChatPage() {
  return (
    <div className="p-4">
      <ChatWidget />
    </div>
  );
}
