/**
 * Types for agent test chat — text-only, no cards, no tools.
 * Kept separate from the business chat types to avoid coupling.
 */

/** A single message in the agent test chat (display format). */
export interface AgentChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  /** Whether this message is a system error (styled differently from assistant text). */
  isError?: boolean;
  timestamp: string;
  /** Persisted tool call activities that occurred before this assistant message. */
  toolActivities?: import("@/hooks/useAgentChat").ToolActivity[];
}

/**
 * Persisted message format stored in agent_conversations.messages jsonb.
 * Supports text messages and tool call/result entries so agents retain
 * tool context across conversation turns.
 */
export interface AgentConversationMessage {
  role: "user" | "assistant" | "tool-call" | "tool-result";
  content: string;
  timestamp: string;
  /** Tool name — only for tool-call / tool-result roles. */
  toolName?: string;
  /** Tool arguments — only for tool-call role. */
  toolArgs?: Record<string, unknown>;
  /** Whether the tool succeeded — only for tool-result role. */
  toolSuccess?: boolean;
}

/** Lightweight summary for the conversation list. */
export interface AgentConversationSummary {
  id: string;
  title: string | null;
  updated_at: string;
  preview: string | null;
  message_count: number;
}

/** SSE events for agent chat. */
export type AgentServerEvent =
  | { type: "text-delta"; delta: string }
  | { type: "text-done" }
  | { type: "thinking"; text: string }
  | { type: "thinking-done" }
  | { type: "tool-call"; toolName: string; displayName: string; args?: Record<string, unknown> }
  | { type: "tool-result"; toolName: string; success: boolean; message?: string; result?: unknown }
  | { type: "done"; assistantContent?: string; conversationId?: string }
  | { type: "error"; message: string };
