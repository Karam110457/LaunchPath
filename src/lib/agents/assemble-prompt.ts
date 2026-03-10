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
  /** Base system prompt from ai_agents.system_prompt */
  systemPrompt: string;
  /** RAG context string (already retrieved). Empty string = no RAG. */
  ragContext: string;
  /** @deprecated No longer used — kept for call-site compatibility */
  toolRecords?: unknown[];
  /** @deprecated No longer used — kept for call-site compatibility */
  resolvedToolKeys?: string[];
  /** Tool failures from buildAgentTools() */
  failures: ToolFailure[];
  /** Structured personality settings (tone, greeting, language). */
  personality?: { tone?: string; greeting_message?: string; language?: string } | null;
  /** Structured wizard config (qualifying questions, behavior). */
  wizardConfig?: {
    templateId?: string;
    qualifyingQuestions?: string[];
    behaviorConfig?: Record<string, unknown>;
  } | null;
  /** Whether this agent has ready knowledge documents (enables knowledge awareness). */
  hasKnowledgeBase?: boolean;
  /** Tool workflow instructions from template (stored in ai_agents.tool_guidelines). */
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
  id: "base" | "config-directives" | "rag" | "knowledge" | "tool-guidelines" | "unavailable";
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

  // ── Section 1: Base system prompt ──────────────────────────────────────
  sections.push({
    id: "base",
    label: "System Prompt",
    content: systemPrompt,
    source: "user",
  });
  parts.push(systemPrompt);

  // ── Section 1.5: Configuration Directives (from structured settings) ──
  const directives: string[] = [];

  if (input.personality?.tone) {
    directives.push(
      `Communication style: Maintain a ${input.personality.tone} tone throughout the conversation.`
    );
  }

  if (input.personality?.language && input.personality.language !== "en") {
    const langNames: Record<string, string> = {
      es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
      it: "Italian", nl: "Dutch", ar: "Arabic", zh: "Chinese (Simplified)",
      ja: "Japanese", ko: "Korean", ru: "Russian", hi: "Hindi",
      tr: "Turkish", pl: "Polish", sv: "Swedish", da: "Danish", he: "Hebrew",
    };
    const langName = langNames[input.personality.language] ?? input.personality.language;
    directives.push(
      `Language: Always respond in ${langName}. Regardless of what language the user writes in, all your responses must be in ${langName}.`
    );
  }

  if (input.wizardConfig?.qualifyingQuestions?.length) {
    const numbered = input.wizardConfig.qualifyingQuestions
      .filter((q) => q.trim())
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    if (numbered) {
      directives.push(
        `Ask these qualifying questions during the conversation:\n${numbered}`
      );
    }
  }

  if (input.wizardConfig?.behaviorConfig) {
    const bc = input.wizardConfig.behaviorConfig;

    if (bc.lead_fields) {
      const fields = bc.lead_fields as Record<string, unknown>;
      const active = [
        "name",
        "email",
        ...Object.entries(fields)
          .filter(([k, v]) => k !== "custom_fields" && v === true)
          .map(([k]) => k),
      ];
      // Add custom fields if present
      const customFields = fields.custom_fields;
      if (Array.isArray(customFields)) {
        active.push(...customFields.filter((f: unknown) => typeof f === "string" && f.trim()));
      }
      directives.push(
        `Lead capture: Collect the following fields from the visitor: ${active.join(", ")}.`
      );
    }

    if (bc.booking_behavior === "book_directly") {
      directives.push(
        "After qualifying, book an appointment directly on the calendar."
      );
    } else if (bc.booking_behavior === "collect_and_follow_up") {
      directives.push(
        "After qualifying, collect the visitor's contact details so the team can follow up manually."
      );
    }

    if (bc.escalation_mode === "always_available") {
      directives.push(
        "Handle all issues yourself without escalating to a human agent."
      );
    } else if (bc.escalation_mode === "escalate_complex") {
      directives.push(
        "If you cannot resolve an issue, escalate to a human agent."
      );
    }

    if (bc.response_style === "concise") {
      directives.push(
        "Response style: Keep answers concise and direct. Get to the point quickly."
      );
    } else if (bc.response_style === "detailed") {
      directives.push(
        "Response style: Provide thorough, step-by-step explanations with context."
      );
    }

    if (bc.notification_behavior === "email_team") {
      directives.push(
        "When a lead is qualified, send an internal notification email to the team with the lead summary. Never email the lead directly."
      );
    } else if (bc.notification_behavior === "sheet_only") {
      directives.push(
        "Save qualified leads to the spreadsheet only. Do not send email notifications."
      );
    }
  }

  if (directives.length > 0) {
    const directivesContent =
      "## Configuration Directives\n" +
      "The following directives override any conflicting instructions in the base prompt above.\n\n" +
      directives.map((d) => `- ${d}`).join("\n");

    sections.push({
      id: "config-directives",
      label: "Configuration Directives",
      content: directivesContent,
      source: "auto",
    });
    parts.push(directivesContent);
  }

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
        "You also have a `search_knowledge_base` tool for deeper or follow-up searches " +
        "across your knowledge base. Use it when the pre-loaded context above doesn't " +
        "fully answer the user's question, or when the user asks about a different topic.";
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

  // ── Section 2.7: Tool Guidelines (from template) ─────────────────────────
  if (input.toolGuidelines?.trim()) {
    sections.push({
      id: "tool-guidelines",
      label: "Tool Guidelines",
      content: input.toolGuidelines,
      source: "auto",
    });
    parts.push(input.toolGuidelines);
  }

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
