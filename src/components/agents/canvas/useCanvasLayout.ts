import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type {
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
  SubagentNodeData,
} from "./canvas-types";

type CanvasNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  draggable: boolean;
};

export type SavedPositions = Record<string, { x: number; y: number }>;

interface LayoutInput {
  agent: AgentNodeData;
  knowledge: KnowledgeNodeData;
  tools: ToolNodeData[];
  subagents: SubagentNodeData[];
  savedPositions?: SavedPositions;
}

// ─── Node dimensions (match actual rendered sizes) ───────────────────────────
const AGENT_W = 240;
const KNOWLEDGE_W = 96;   // KnowledgeNode circle diameter
const TOOL_W = 84;        // ToolNode square side
const SUBAGENT_W = 200;   // SubagentNode width

// ─── Layout geometry ─────────────────────────────────────────────────────────
// Agent handles at 25% and 75% of AGENT_W
const LEFT_HANDLE_X = AGENT_W * 0.25;   // 60  — "Knowledge Base"
const RIGHT_HANDLE_X = AGENT_W * 0.75;  // 180 — "Tools"

const ROW_GAP = 260;           // vertical distance: agent top → children row top
const TOOL_H_SPACING = 160;    // horizontal center-to-center spacing between tools
const SUBAGENT_H_SPACING = 240; // wider spacing for subagent nodes

// Place knowledge at x=0 so its center (48) aligns with the agent's left handle
const KNOWLEDGE_X = 0;
const KNOWLEDGE_CENTER_X = KNOWLEDGE_X + KNOWLEDGE_W / 2; // 48

// Agent x: left handle must sit over knowledge center
const AGENT_X = KNOWLEDGE_CENTER_X - LEFT_HANDLE_X; // -12

// First tool x: agent right handle must sit over first tool center
const FIRST_TOOL_CENTER_X = AGENT_X + RIGHT_HANDLE_X; // 168
const FIRST_TOOL_X = FIRST_TOOL_CENTER_X - TOOL_W / 2; // 126

// Children row y (top of knowledge / tool nodes)
const CHILDREN_Y = ROW_GAP;

// ─────────────────────────────────────────────────────────────────────────────

export function useCanvasLayout({ agent, knowledge, tools, subagents, savedPositions }: LayoutInput) {
  return useMemo(() => {
    // Helper: use saved position if available, otherwise default
    const pos = (id: string, defaultPos: { x: number; y: number }) =>
      savedPositions?.[id] ?? defaultPos;

    // Calculate where subagent nodes start (after all regular tools)
    const toolsEndX = tools.length > 0
      ? FIRST_TOOL_X + (tools.length - 1) * TOOL_H_SPACING + TOOL_W
      : FIRST_TOOL_CENTER_X;
    const subagentStartX = tools.length > 0
      ? toolsEndX + 80 // gap after last tool
      : FIRST_TOOL_X;  // or start where tools would

    const nodes: CanvasNode[] = [
      // Agent — top, left handle → knowledge, right handle → tools
      {
        id: "agent",
        type: "agentNode",
        position: pos("agent", { x: AGENT_X, y: 0 }),
        data: agent as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Knowledge — bottom left, centered under left handle
      {
        id: "knowledge",
        type: "knowledgeNode",
        position: pos("knowledge", { x: KNOWLEDGE_X, y: CHILDREN_Y }),
        data: knowledge as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Tools — horizontal row to the right of knowledge, all at same y
      ...tools.map((tool, i) => ({
        id: `tool-${tool.toolId}`,
        type: "toolNode",
        position: pos(`tool-${tool.toolId}`, {
          x: FIRST_TOOL_X + i * TOOL_H_SPACING,
          y: CHILDREN_Y,
        }),
        data: tool as unknown as Record<string, unknown>,
        draggable: true,
      })),
      // Subagents — after tools, wider nodes
      ...subagents.map((sa, i) => ({
        id: `subagent-${sa.subagentId}`,
        type: "subagentNode",
        position: pos(`subagent-${sa.subagentId}`, {
          x: subagentStartX + i * SUBAGENT_H_SPACING,
          y: CHILDREN_Y,
        }),
        data: sa as unknown as Record<string, unknown>,
        draggable: true,
      })),
    ];

    const edges: Edge[] = [
      // Agent → Knowledge
      {
        id: "agent-knowledge",
        source: "agent",
        sourceHandle: "bottom-left",
        target: "knowledge",
        type: "dashedEdge",
      },
      // Agent → each tool node
      ...tools.map((tool) => ({
        id: `agent-tool-${tool.toolId}`,
        source: "agent",
        sourceHandle: "bottom-right",
        target: `tool-${tool.toolId}`,
        type: "dashedEdge",
      })),
      // Agent → each subagent node
      ...subagents.map((sa) => ({
        id: `agent-subagent-${sa.subagentId}`,
        source: "agent",
        sourceHandle: "bottom-right",
        target: `subagent-${sa.subagentId}`,
        type: "dashedEdge",
      })),
    ];

    return { nodes, edges };
  }, [agent, knowledge, tools, subagents, savedPositions]);
}
