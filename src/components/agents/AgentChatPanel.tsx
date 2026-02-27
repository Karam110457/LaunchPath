"use client";

/**
 * AgentChatPanel — test chat interface for agent detail page.
 * Text-only: user bubbles + assistant streaming text. No cards.
 * Reuses InputBar, StreamingText, TypingIndicator, ThinkingBubble.
 */

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { useAgentChat } from "@/hooks/useAgentChat";
import { InputBar } from "@/components/chat/InputBar";
import { StreamingText } from "@/components/chat/StreamingText";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ThinkingBubble } from "@/components/chat/ThinkingBubble";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  AgentChatMessage,
  AgentConversationMessage,
} from "@/lib/chat/agent-chat-types";

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
  initialMessages: AgentConversationMessage[];
}

export function AgentChatPanel({
  agentId,
  agentName,
  greetingMessage,
  initialMessages,
}: AgentChatPanelProps) {
  const {
    messages,
    isStreaming,
    isTyping,
    isThinking,
    thinkingText,
    sendMessage,
    clearConversation,
  } = useAgentChat({ agentId, initialMessages, greetingMessage });

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isThinking, thinkingText]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-16rem)] min-h-[400px] border border-border rounded-xl overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
        <span className="text-sm font-semibold text-foreground tracking-tight">
          Chat with {agentName}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={isStreaming || messages.length === 0}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Chat
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will erase the entire test conversation. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearConversation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear conversation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 pb-36"
        aria-label="Test conversation"
      >
        <div className="max-w-3xl mx-auto w-full px-4 space-y-4">
          {messages.map((msg) => (
            <AgentMessage key={msg.id} message={msg} />
          ))}

          {/* Thinking indicator */}
          {(isThinking || thinkingText) && isStreaming && (
            <ThinkingBubble
              thinkingText={thinkingText}
              isThinking={isThinking}
            />
          )}

          {/* Typing indicator */}
          {isTyping && !isThinking && <TypingIndicator />}
        </div>
      </div>

      {/* Floating input */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-10">
        <InputBar onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

/** Simple message bubble — no card handling. */
function AgentMessage({ message }: { message: AgentChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-foreground leading-relaxed py-1">
      <StreamingText
        content={message.content}
        isStreaming={message.isStreaming ?? false}
      />
    </div>
  );
}
