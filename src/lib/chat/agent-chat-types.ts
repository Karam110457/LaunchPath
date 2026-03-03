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
  timestamp: string;
}

/** Persisted message format stored in agent_conversations.messages jsonb. */
export interface AgentConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
