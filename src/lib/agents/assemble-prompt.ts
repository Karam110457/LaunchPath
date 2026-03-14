/**
 * assemblePrompt — shared, channel-agnostic system prompt assembly.
 *
 * Combines the agent's base system prompt with tool instructions,
 * degradation messages, and RAG context into a single string.
 *
 * This is a PURE function — no DB calls, no side effects. Any channel
 * (chat, WhatsApp, widget, etc.) calls it with the same inputs and gets
 * the same output.
 */

import type { ToolFailure } from "@/lib/tools/integrations/composio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssemblePromptInput {
  /** Base system prompt from ai_agents.system_prompt (now includes config directives). */
  systemPrompt: string;
  /** RAG context string (already retrieved). Empty string = no RAG. */
  ragContext: string;
  /** @deprecated No longer used — kept for call-site compatibility */
  toolRecords?: unknown[];
  /** @deprecated No longer used — kept for call-site compatibility */
  resolvedToolKeys?: string[];
  /** Tool failures from buildAgentTools() */
  failures: ToolFailure[];
  /** @deprecated Config directives are now baked into system_prompt. Kept for call-site compat. */
  personality?: { tone?: string; greeting_message?: string; language?: string } | null;
  /** @deprecated Config directives are now baked into system_prompt. Kept for call-site compat. */
  wizardConfig?: {
    templateId?: string;
    qualifyingQuestions?: string[];
    behaviorConfig?: Record<string, unknown>;
  } | null;
  /** Whether this agent has ready knowledge documents (enables knowledge awareness). */
  hasKnowledgeBase?: boolean;
  /** @deprecated Tool guidelines are now baked into system_prompt config directives. Kept for compat. */
  toolGuidelines?: string;
}

export interface AssemblePromptResult {
  /** The fully assembled system prompt string to pass to streamText(). */
  systemPrompt: string;
  /** Structured sections for UI preview. */
  sections: PromptSection[];
}

export interface PromptSection {
  /** Section identifier */
  id: "base" | "rag" | "knowledge" | "unavailable";
  /** Human-readable label */
  label: string;
  /** The raw text content of this section */
  content: string;
  /** Whether this was user-written or auto-generated */
  source: "user" | "auto";
}

// ---------------------------------------------------------------------------
// Main assembly function
// ---------------------------------------------------------------------------

export function assemblePrompt(input: AssemblePromptInput): AssemblePromptResult {
  const {
    systemPrompt,
    ragContext,
    failures,
  } = input;

  const sections: PromptSection[] = [];
  const parts: string[] = [];

  // ── Section 1: Base system prompt (now includes config directives) ─────
  // Config directives are baked into system_prompt at save time, so users
  // can see and edit them on the Advanced (Prompt) tab.
  sections.push({
    id: "base",
    label: "System Prompt",
    content: systemPrompt,
    source: "user",
  });
  parts.push(systemPrompt);

  // ── Section 2: RAG context (dynamic per-query) ─────────────────────────
  if (ragContext) {
    sections.push({
      id: "rag",
      label: "Knowledge Context",
      content: ragContext,
      source: "auto",
    });
    parts.push(ragContext);
  }

  // ── Section 2.5: Knowledge Awareness ──────────────────────────────────
  if (input.hasKnowledgeBase) {
    if (ragContext) {
      // Auto-retrieval found hits — agent already has context, just note the tool
      const knowledgeNote =
        "The knowledge context above covers the most relevant excerpts for the user's latest message. " +
        "If the user asks about multiple topics, some may not be covered above. " +
        "Use the `search_knowledge_base` tool to find information on any topic not addressed above, " +
        "or when you need more detail on a specific point.";
      sections.push({
        id: "knowledge",
        label: "Knowledge Tool Note",
        content: knowledgeNote,
        source: "auto",
      });
      parts.push(knowledgeNote);
    } else {
      // No auto-retrieved context — tell the agent it has knowledge and should search
      const knowledgeAwareness =
        "## Knowledge Base\n" +
        "You have access to a knowledge base containing uploaded documents and website content. " +
        "Use the `search_knowledge_base` tool to find relevant information when users ask questions. " +
        "Always search your knowledge base before saying you don't have information on a topic.";
      sections.push({
        id: "knowledge",
        label: "Knowledge Base",
        content: knowledgeAwareness,
        source: "auto",
      });
      parts.push(knowledgeAwareness);
    }
  }

  // ── Section 2.7: Tool Guidelines ─────────────────────────────────────
  // Tool guidelines are now baked into system_prompt config directives at
  // save time. This section is kept only for backward compat with agents
  // that haven't been re-saved yet.

  // ── Section 3: Unavailable Tools ────────────────────────────────────
  if (failures.length > 0) {
    const failureLines = failures
      .map((f) => `- **${f.displayName}** (${f.toolkit}): ${f.reason}`)
      .join("\n");
    const unavailableSection =
      `## Unavailable Tools\n` +
      `The following tools could not be loaded. If the user asks about them, explain the issue and suggest they reconnect the app in their tool settings.\n\n` +
      failureLines;

    sections.push({
      id: "unavailable",
      label: "Unavailable Tools",
      content: unavailableSection,
      source: "auto",
    });
    parts.push(unavailableSection);
  }

  return {
    systemPrompt: parts.join("\n\n"),
    sections,
  };
}
