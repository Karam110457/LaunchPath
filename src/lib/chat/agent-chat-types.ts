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

/** SSE events for agent chat — subset of ServerEvent, text-only. */
export type AgentServerEvent =
  | { type: "text-delta"; delta: string }
  | { type: "text-done" }
  | { type: "thinking"; text: string }
  | { type: "thinking-done" }
  | { type: "done"; assistantContent?: string }
  | { type: "error"; message: string };
