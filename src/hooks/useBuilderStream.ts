"use client";

import { useState, useCallback, useRef } from "react";
import type { BuilderCodeEvent } from "@/lib/chat/builder-code-tools";

interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseBuilderStreamReturn {
  messages: BuilderMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useBuilderStream(
  systemId: string,
  codeRef: React.RefObject<string | null>,
  onCodeUpdate: (code: string) => void
): UseBuilderStreamReturn {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Track conversation history for multi-turn context
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    []
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (isStreaming || !text.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: BuilderMessage = {
        id: generateId(),
        role: "user",
        content: text,
      };

      const assistantMsg: BuilderMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const currentCode = codeRef.current;
      if (!currentCode) return;

      fetch(`/api/builder/${systemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          currentCode,
          history: historyRef.current,
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";

            for (const chunk of chunks) {
              const dataLine = chunk
                .split("\n")
                .find((l) => l.startsWith("data: "));
              if (!dataLine) continue;

              try {
                const event = JSON.parse(dataLine.slice(6)) as BuilderCodeEvent;

                if (event.type === "text-delta") {
                  fullText += event.delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: fullText }
                        : m
                    )
                  );
                } else if (event.type === "code-update") {
                  onCodeUpdate(event.code);
                } else if (event.type === "error") {
                  fullText += `\n\n_Error: ${event.message}_`;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: fullText }
                        : m
                    )
                  );
                }
              } catch {
                // Ignore malformed events
              }
            }
          }

          // Update history for next message
          historyRef.current = [
            ...historyRef.current,
            { role: "user", content: text },
            { role: "assistant", content: fullText },
          ];

          setIsStreaming(false);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;

          const errorText = err instanceof Error ? err.message : "Unknown error";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: `_Error: ${errorText}_` }
                : m
            )
          );
          setIsStreaming(false);
        });
    },
    [systemId, codeRef, onCodeUpdate, isStreaming]
  );

  return { messages, isStreaming, sendMessage };
}
