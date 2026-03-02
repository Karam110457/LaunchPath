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

// Vertical hierarchy: agent top-center, knowledge + tools below
const TOOL_SPACING  = 130; // px gap between tool nodes
const ROW_GAP       = 280; // vertical gap from agent to children
const AGENT_W       = 220;
const CHILD_W       = 195;

export function useCanvasLayout({ agent, knowledge, tools }: LayoutInput) {
  return useMemo(() => {
    // Right column height
    const toolsColHeight = tools.length > 0 ? (tools.length - 1) * TOOL_SPACING : 0;

    // Center agent horizontally between knowledge center and tools center
    const knowledgeCenterX = CHILD_W / 2;                     // ~97
    const toolsCenterX     = CHILD_W + 180 + CHILD_W / 2;    // ~470  (knowledge + gap + tools center)
    const agentCenterX     = (knowledgeCenterX + toolsCenterX) / 2;
    const agentX           = Math.round(agentCenterX - AGENT_W / 2);

    // Knowledge starts at y = ROW_GAP, vertically centered with tools column
    const knowledgeX = 0;
    const knowledgeY = ROW_GAP + Math.round(toolsColHeight / 2);

    // Tools start at y = ROW_GAP
    const toolsX = CHILD_W + 180;
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
      // Knowledge (bottom left)
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
