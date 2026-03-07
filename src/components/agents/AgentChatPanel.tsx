"use client";

/**
 * AgentChatPanel — test chat interface with multi-conversation support.
 * Text-only: user bubbles + assistant streaming text.
 */

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
} from "lucide-react";
import { useAgentChat } from "@/hooks/useAgentChat";
import { InputBar } from "@/components/chat/InputBar";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
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
import { cn } from "@/lib/utils";
import type { AgentChatMessage } from "@/lib/chat/agent-chat-types";
import type { ToolActivity } from "@/hooks/useAgentChat";

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
  embedded?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AgentChatPanel({
  agentId,
  greetingMessage,
  embedded,
}: AgentChatPanelProps) {
  const {
    messages,
    isStreaming,
    isTyping,
    isThinking,
    thinkingText,
    toolActivity,
    sendMessage,
    conversations,
    activeConversationId,
    isLoadingConversations,
    startNewConversation,
    switchConversation,
    deleteConversation,
  } = useAgentChat({ agentId, greetingMessage });

  const [showDropdown, setShowDropdown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isThinking, thinkingText, toolActivity]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ??
    (activeConversationId ? "Untitled" : null);

  return (
    <div
      className={`relative flex flex-col ${embedded ? "h-full bg-transparent" : "h-[calc(100vh-16rem)] min-h-[400px] border border-border rounded-xl bg-background"} overflow-hidden`}
    >
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${embedded ? "border-white/20 bg-transparent" : "border-border bg-background/80 backdrop-blur-sm"}`}>
        {/* Left: Conversation picker */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors max-w-[240px]"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {activeTitle ?? "New conversation"}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 shrink-0 text-muted-foreground transition-transform",
                showDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-72 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No past conversations
                </div>
              ) : (
                <div className="max-h-[240px] overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        switchConversation(conv.id);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors group",
                        conv.id === activeConversationId && "bg-muted/30"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {conv.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(conv.updated_at)}
                          {" · "}
                          {conv.message_count} msgs
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: New chat + delete current */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              startNewConversation();
              setShowDropdown(false);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          {activeConversationId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={isStreaming}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this test conversation. This
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteConversation(activeConversationId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 pb-36"
        aria-label="Test conversation"
      >
        <div className="max-w-3xl mx-auto w-full px-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {/* Persisted tool activities shown above the assistant response */}
              {msg.toolActivities && msg.toolActivities.length > 0 && (
                <div className="mb-2">
                  <ToolActivityDisplay activities={msg.toolActivities} />
                </div>
              )}
              <AgentMessage message={msg} />
            </div>
          ))}

          {/* Live tool activity (while streaming) */}
          {toolActivity.length > 0 && (
            <ToolActivityDisplay activities={toolActivity} />
          )}

          {/* Thinking indicator */}
          {(isThinking || thinkingText) && isStreaming && (
            <ThinkingBubble
              thinkingText={thinkingText}
              isThinking={isThinking}
            />
          )}

          {/* Typing indicator */}
          {isTyping && !isThinking && toolActivity.length === 0 && <TypingIndicator />}
        </div>
      </div>

      {/* Floating input */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-10 ${embedded ? "bg-white/40 backdrop-blur-md rounded-b-[2rem]" : ""}`}>
        {embedded ? (
          <PlaceholdersAndVanishInput
            placeholders={[
              "Type a message…",
              "Ask anything…",
              "Agent is thinking…",
            ]}
            onSubmitValue={sendMessage}
            disabled={isStreaming}
          />
        ) : (
          <InputBar onSend={sendMessage} disabled={isStreaming} embedded={embedded} />
        )}
      </div>
    </div>
  );
}

/** Tool activity cards with expandable request/response for debugging. */
function ToolActivityDisplay({ activities }: { activities: ToolActivity[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col gap-2 py-1">
      {activities.map((activity, i) => {
        const isOpen = expanded.has(i);
        const hasDetails = !!(activity.args || activity.result !== undefined);
        const isDone = activity.status !== "running";

        return (
          <div
            key={`${activity.toolName}-${i}`}
            className={cn(
              "self-start rounded-xl border text-xs transition-all overflow-hidden",
              activity.status === "running"
                ? "bg-primary/5 border-primary/20"
                : activity.status === "done"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-destructive/5 border-destructive/20"
            )}
          >
            {/* Header row — always visible */}
            <button
              type="button"
              onClick={() => hasDetails && isDone && toggle(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 w-full text-left",
                hasDetails && isDone ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default",
                activity.status === "running"
                  ? "text-primary/80"
                  : activity.status === "done"
                    ? "text-emerald-500/80"
                    : "text-destructive/80"
              )}
            >
              {activity.status === "running" ? (
                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              ) : activity.status === "done" ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 shrink-0" />
              )}
              <Wrench className="w-2.5 h-2.5 shrink-0 opacity-60" />
              <span className="flex-1">
                {activity.status === "running"
                  ? activity.displayName + "…"
                  : activity.message ?? activity.displayName}
              </span>
              {hasDetails && isDone ? (
                isOpen
                  ? <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                  : <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              ) : null}
            </button>

            {/* Expanded details */}
            {isOpen && hasDetails && (
              <div className="border-t border-border/30 px-3 py-2 space-y-2 text-[11px] text-muted-foreground">
                {activity.args && Object.keys(activity.args).length > 0 && (
                  <div>
                    <p className="font-semibold text-muted-foreground/70 mb-1 uppercase tracking-wider text-[9px]">
                      Request
                    </p>
                    <pre className="bg-black/30 rounded-lg px-2.5 py-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-zinc-400 max-h-[200px] overflow-y-auto">
                      {JSON.stringify(activity.args, null, 2)}
                    </pre>
                  </div>
                )}
                {activity.result !== undefined && (
                  <div>
                    <p className="font-semibold text-muted-foreground/70 mb-1 uppercase tracking-wider text-[9px]">
                      Response
                    </p>
                    <pre className="bg-black/30 rounded-lg px-2.5 py-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-zinc-400 max-h-[200px] overflow-y-auto">
                      {typeof activity.result === "string"
                        ? activity.result
                        : JSON.stringify(activity.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Simple message bubble. */
function AgentMessage({ message }: { message: AgentChatMessage }) {
  const timeLabel = message.timestamp
    ? new Date(message.timestamp).toLocaleString()
    : undefined;

  if (message.role === "user") {
    return (
      <div className="flex justify-end" title={timeLabel}>
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-sm text-foreground leading-relaxed py-1"
      title={timeLabel}
    >
      <StreamingText
        content={message.content}
        isStreaming={message.isStreaming ?? false}
      />
    </div>
  );
}
