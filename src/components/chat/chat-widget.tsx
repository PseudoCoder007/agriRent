"use client";

import { useState } from "react";

import { AgriMateAIIcon } from "@/components/brand/agri-mate-ai-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveChatMessageAction } from "@/app/actions/chat.actions";

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
export function ChatWidget({
  initialMessages = [],
}: {
  initialMessages?: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
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
    await saveChatMessageAction("user", content);
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
      let accumulatedContent = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const token = decoder.decode(value, { stream: true });
        accumulatedContent += token;
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

      await saveChatMessageAction("assistant", accumulatedContent);
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
      <CardHeader className="gap-2 border-b bg-gradient-to-r from-emerald-50/80 via-white to-lime-50/70 pb-4 dark:from-emerald-950/30 dark:via-card dark:to-lime-950/20">
        <CardTitle className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/90 p-2 shadow-sm dark:border-emerald-500/20 dark:bg-background">
            <AgriMateAIIcon variant="navbar" className="size-6" />
          </span>
          <span className="leading-tight">Chat with AgriMate AI</span>
        </CardTitle>
        <p className="text-xs font-normal text-muted-foreground">
          Your Smart Farming Assistant
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex min-h-[320px] flex-col gap-3 overflow-y-auto rounded-2xl border border-border/70 bg-muted/20 p-4">
          {messages.length === 0 && (
            <div className="max-w-sm rounded-2xl border border-dashed border-emerald-200/70 bg-white/80 p-4 text-sm text-muted-foreground shadow-sm dark:border-emerald-500/15 dark:bg-background/80">
              Get instant answers about booking, pricing, or how rentals work on AgriRent.
            </div>
          )}
          {messages.map((message, index) => {
            const isAssistant = message.role === "assistant";

            return (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "self-end rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm"
                  : "flex max-w-[90%] items-start gap-3 self-start"
              }
            >
              {isAssistant ? (
                <>
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-white p-1.5 shadow-sm dark:border-emerald-500/20 dark:bg-background">
                    <AgriMateAIIcon variant="avatar" className="size-5" />
                  </span>
                  <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-foreground shadow-sm">
                    {message.content || (isPending && index === messages.length - 1 ? <TypingDots /> : null)}
                  </div>
                </>
              ) : (
                message.content
              )}
            </div>
            );
          })}
          {isPending && messages[messages.length - 1]?.role === "user" && (
            <div className="flex max-w-[90%] items-start gap-3 self-start">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-white p-1.5 shadow-sm dark:border-emerald-500/20 dark:bg-background">
                <AgriMateAIIcon variant="avatar" className="size-5" />
              </span>
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
                <TypingDots />
              </div>
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
            className="h-11 rounded-2xl border-border/80 bg-background px-4 shadow-sm placeholder:text-muted-foreground/80 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
          />
          <Button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            className="h-11 rounded-2xl px-5"
          >
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5" aria-label="AgriMate AI is typing">
      <span className="size-2 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:-0.2s]" />
      <span className="size-2 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:-0.1s]" />
      <span className="size-2 rounded-full bg-emerald-500/80 animate-bounce" />
    </span>
  );
}
