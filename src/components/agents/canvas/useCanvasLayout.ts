import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type {
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
} from "./canvas-types";

type CanvasNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  draggable: boolean;
};

interface LayoutInput {
  agent: AgentNodeData;
  knowledge: KnowledgeNodeData;
  tools: ToolNodeData[];
}

// Node dimensions (match actual rendered sizes)
const AGENT_W = 240;  // AgentNode width
const KNOWLEDGE_W = 96;  // KnowledgeNode circle diameter
const TOOL_W = 84;  // ToolNode width

// Spacing
const TOOL_SPACING = 170;  // vertical gap between stacked tool nodes
const ROW_GAP = 270;  // vertical distance from agent top to first child
const COL_GAP = 185;  // horizontal gap between knowledge and tools columns

export function useCanvasLayout({ agent, knowledge, tools }: LayoutInput) {
  return useMemo(() => {
    const toolsColHeight = tools.length > 0 ? (tools.length - 1) * TOOL_SPACING : 0;

    // Horizontal centering: agent sits between the two child columns
    const knowledgeCenterX = KNOWLEDGE_W / 2;                   // ~65
    const toolsX = KNOWLEDGE_W + COL_GAP;             // ~315
    const toolsCenterX = toolsX + TOOL_W / 2;               // ~385
    const agentCenterX = (knowledgeCenterX + toolsCenterX) / 2;
    const agentX = Math.round(agentCenterX - AGENT_W / 2);

    // Knowledge: vertically centered alongside tools column
    const knowledgeX = 0;
    const knowledgeY = ROW_GAP + Math.round(toolsColHeight / 2);

    // Tools: start at ROW_GAP, stack downward
    const toolsStartY = ROW_GAP;

    const nodes: CanvasNode[] = [
      // Agent (top center)
      {
        id: "agent",
        type: "agentNode",
        position: { x: agentX, y: 0 },
        data: agent as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Knowledge (bottom left — circle)
      {
        id: "knowledge",
        type: "knowledgeNode",
        position: { x: knowledgeX, y: knowledgeY },
        data: knowledge as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Per-tool nodes (bottom right, stacked)
      ...tools.map((tool, i) => ({
        id: `tool-${tool.toolId}`,
        type: "toolNode",
        position: { x: toolsX, y: toolsStartY + i * TOOL_SPACING },
        data: tool as unknown as Record<string, unknown>,
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
    ];

    return { nodes, edges };
  }, [agent, knowledge, tools]);
}
