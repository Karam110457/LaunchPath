/**
 * assemblePrompt — shared, channel-agnostic system prompt assembly.
 *
 * Combines the agent's base system prompt with tool instructions, tool
 * guidelines, degradation messages, and RAG context into a single string.
 *
 * This is a PURE function — no DB calls, no side effects. Any channel
 * (chat, WhatsApp, widget, etc.) calls it with the same inputs and gets
 * the same output.
 */

import type { AgentToolRecord, ComposioToolConfig } from "@/lib/tools/types";
import type { ToolFailure } from "@/lib/tools/integrations/composio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssemblePromptInput {
  /** Base system prompt from ai_agents.system_prompt */
  systemPrompt: string;
  /** RAG context string (already retrieved). Empty string = no RAG. */
  ragContext: string;
  /** Enabled tool records from agent_tools */
  toolRecords: AgentToolRecord[];
  /** Resolved tool keys from buildAgentTools() — for Composio action listing */
  resolvedToolKeys: string[];
  /** Tool failures from buildAgentTools() */
  failures: ToolFailure[];
  /** Custom tool guidelines from ai_agents.tool_guidelines. null = defaults. */
  toolGuidelines: string | null;
}

export interface AssemblePromptResult {
  /** The fully assembled system prompt string to pass to streamText(). */
  systemPrompt: string;
  /** Structured sections for UI preview. */
  sections: PromptSection[];
}

export interface PromptSection {
  /** Section identifier */
  id: "base" | "rag" | "tools" | "guidelines" | "unavailable";
  /** Human-readable label */
  label: string;
  /** The raw text content of this section */
  content: string;
  /** Whether this was user-written or auto-generated */
  source: "user" | "auto";
}

// ---------------------------------------------------------------------------
// Default tool guidelines — visible in the UI, editable by users
// ---------------------------------------------------------------------------

export const DEFAULT_TOOL_GUIDELINES =
  `- When a tool returns a result, check the \`successful\` field. If \`successful\` is false, explain what went wrong to the user using the \`error\` field and suggest they reconnect the app in their settings.\n` +
  `- Tool results are in the \`data\` field — summarize the key information conversationally. Never dump raw JSON to the user.\n` +
  `- If a tool fails, explain the issue clearly and suggest next steps. Do not retry the same call unless you change the parameters.\n` +
  `- You can call multiple tools in sequence to complete complex tasks (e.g., search for contacts then send an email to the result).`;

// ---------------------------------------------------------------------------
// Main assembly function
// ---------------------------------------------------------------------------

export function assemblePrompt(input: AssemblePromptInput): AssemblePromptResult {
  const {
    systemPrompt,
    ragContext,
    toolRecords,
    resolvedToolKeys,
    failures,
    toolGuidelines,
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

  // ── Section 3: Tools Available ─────────────────────────────────────────
  const enabledTools = toolRecords.filter((t) => t.is_enabled);

  if (enabledTools.length > 0 && resolvedToolKeys.length > 0) {
    const toolLines: string[] = [];

    for (const t of enabledTools) {
      if (t.tool_type === "composio") {
        const cfg = t.config as unknown as ComposioToolConfig;
        const prefix = (cfg.toolkit ?? "")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");

        // List actual tool keys this toolkit contributes
        const actionKeys = resolvedToolKeys.filter(
          (k) => k.startsWith(prefix + "_")
        );

        if (actionKeys.length > 0) {
          const actionList = actionKeys
            .map((k) => {
              const friendly = k
                .slice(prefix.length + 1)
                .toLowerCase()
                .replace(/_/g, " ");
              return `  - \`${k}\` — ${friendly}`;
            })
            .join("\n");
          toolLines.push(
            `- **${t.display_name}** (${cfg.toolkit_name ?? cfg.toolkit}): ${t.description}\n  Available actions:\n${actionList}`
          );
        } else {
          toolLines.push(`- **${t.display_name}**: ${t.description}`);
        }
      } else {
        toolLines.push(`- **${t.display_name}**: ${t.description}`);
      }
    }

    const toolsSection =
      `## Tools Available\n` +
      `You have the following tools. Use them proactively — if the user's request matches a tool's purpose, call the tool rather than just describing what you would do. Do not ask for permission to use a tool when the user's intent is clear.\n\n` +
      toolLines.join("\n");

    sections.push({
      id: "tools",
      label: "Tools Available",
      content: toolsSection,
      source: "auto",
    });
    parts.push(toolsSection);

    // ── Section 4: Tool Guidelines ─────────────────────────────────────
    const guidelinesText = toolGuidelines ?? DEFAULT_TOOL_GUIDELINES;
    const guidelinesSection = `### Tool Usage Guidelines\n${guidelinesText}`;

    sections.push({
      id: "guidelines",
      label: "Tool Guidelines",
      content: guidelinesText,
      source: toolGuidelines !== null ? "user" : "auto",
    });
    parts.push(guidelinesSection);
  }

  // ── Section 5: Unavailable Tools ────────────────────────────────────
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
