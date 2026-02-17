/**
 * Shared types for the chat-based business building flow.
 * Used by the API route, tools, hook, and frontend components.
 */

import type { AIRecommendation, AssembledOffer } from "@/lib/ai/schemas";

// ---------------------------------------------------------------------------
// Card data types — what the server sends to render a specific card
// ---------------------------------------------------------------------------

export interface CardOption {
  value: string;
  label: string;
  description?: string;
}

export interface EditableField {
  name: string;
  label: string;
  value: string;
  type: "text" | "textarea" | "number";
  hint?: string;
  prefix?: string; // e.g. "£" for pricing fields
}

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

export type CardData =
  | {
      type: "option-selector";
      id: string;
      question: string;
      options: CardOption[];
      multiSelect?: boolean;
      maxSelect?: number;
    }
  | {
      type: "text-input";
      id: string;
      question: string;
      placeholder: string;
      hint?: string;
      multiline?: boolean;
    }
  | {
      type: "location";
      id: string;
    }
  | {
      type: "progress-tracker";
      id: string;
      title: string;
      steps: ProgressStep[];
    }
  | {
      type: "score-cards";
      id: string;
      recommendations: AIRecommendation[];
    }
  | {
      type: "editable-content";
      id: string;
      title: string;
      subtitle?: string;
      fields: EditableField[];
      confirmLabel?: string;
    }
  | {
      type: "offer-summary";
      id: string;
      offer: AssembledOffer;
    }
  | {
      type: "system-ready";
      id: string;
      demoUrl: string;
      offer: AssembledOffer;
    };

// ---------------------------------------------------------------------------
// SSE events from server → client
// ---------------------------------------------------------------------------

export type ServerEvent =
  | { type: "text-delta"; delta: string }
  | { type: "text-done" }
  | { type: "tool-start"; toolName: string }
  | { type: "progress"; cardId: string; stepId: string; status: "active" | "done"; label?: string }
  | { type: "card"; card: CardData }
  | { type: "done" }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Frontend message list
// ---------------------------------------------------------------------------

export type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
      isCardResponse?: boolean;
      timestamp: string;
    }
  | {
      id: string;
      role: "assistant";
      type: "text";
      content: string;
      isStreaming: boolean;
      timestamp: string;
    }
  | {
      id: string;
      role: "assistant";
      type: "card";
      card: CardData;
      completed: boolean;
      timestamp: string;
    };

// ---------------------------------------------------------------------------
// Persisted to user_systems.conversation_history
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  cardRef?: {
    type: string;
    completed: boolean;
    summary?: string; // one-line summary of what was selected/entered
  };
  timestamp: string;
}
