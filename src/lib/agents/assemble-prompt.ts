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

import type {
  AgentToolRecord,
  ComposioToolConfig,
  ActionConfig,
} from "@/lib/tools/types";
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
}

export interface AssemblePromptResult {
  /** The fully assembled system prompt string to pass to streamText(). */
  systemPrompt: string;
  /** Structured sections for UI preview. */
  sections: PromptSection[];
}

export interface PromptSection {
  /** Section identifier */
  id: "base" | "rag" | "tools" | "unavailable";
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
    toolRecords,
    resolvedToolKeys,
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

              // Note pinned params so agent knows about constraints
              const actionCfg = cfg.action_configs?.[k];
              const pinnedEntries =
                actionCfg &&
                typeof actionCfg === "object" &&
                (actionCfg as ActionConfig).pinned_params
                  ? Object.entries((actionCfg as ActionConfig).pinned_params)
                  : [];

              const pinnedNote =
                pinnedEntries.length > 0
                  ? ` (pre-configured: ${pinnedEntries
                      .map(([pName, pVal]) => `${pName}="${pVal}"`)
                      .join(", ")})`
                  : "";

              return `  - \`${k}\` — ${friendly}${pinnedNote}`;
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
  }

  // ── Section 4: Unavailable Tools ────────────────────────────────────
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
