"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ERROR_MESSAGE = "The assistant is busy, try again in a moment.";

/**
 * Client Component chat UI for the dedicated /chat route (D-04 — not a
 * floating widget). Never imports ai.service.ts directly; only ever talks
 * to /api/chat over fetch, so the server-side NVIDIA credential is never
 * reachable from this file (see T-04-01).
 */
export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const content = input.trim();
    if (!content || isPending) {
      return;
    }

    setError(null);
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        setError(ERROR_MESSAGE);
        setIsPending(false);
        return;
      }

      // Append a placeholder assistant message, then stream tokens into it
      // as they arrive rather than waiting for the full response.
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const token = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          };
          return updated;
        });
      }
    } catch {
      setError(ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !isPending) {
      void handleSend();
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>AgriRent Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex min-h-[300px] flex-col gap-3 overflow-y-auto rounded-md border p-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask a question about how booking and rental works on AgriRent.
            </p>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "self-end rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "self-start rounded-md bg-muted px-3 py-2 text-sm"
              }
            >
              {message.content || (isPending && index === messages.length - 1 ? "..." : "")}
            </div>
          ))}
          {isPending && messages[messages.length - 1]?.role === "user" && (
            <div className="self-start rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking...
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about booking, approval, or pricing..."
            disabled={isPending}
          />
          <Button onClick={handleSend} disabled={isPending || !input.trim()}>
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
