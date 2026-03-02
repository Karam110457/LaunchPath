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

// Horizontal layout: Knowledge ←— Agent —→ Tools (stacked vertically)
const KNOWLEDGE_X = 0;
const AGENT_X     = 270;
const TOOLS_X     = 560;
const TOOL_SPACING = 130; // px between each tool node

export function useCanvasLayout({ agent, knowledge, tools }: LayoutInput) {
  return useMemo(() => {
    // Vertically center the agent with the right-side column (tools + addTool)
    const rightCount = tools.length + 1; // tools + addTool
    const rightSpan  = (rightCount - 1) * TOOL_SPACING;
    const centerY    = rightSpan / 2;
    const agentY     = Math.max(centerY - 65, 0); // 65 ≈ half of agent node height
    const knowledgeY = Math.max(centerY - 50, 0); // 50 ≈ half of knowledge node height

    const nodes: CanvasNode[] = [
      // Agent (center)
      {
        id: "agent",
        type: "agentNode",
        position: { x: AGENT_X, y: agentY },
        data: agent as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Knowledge (left)
      {
        id: "knowledge",
        type: "knowledgeNode",
        position: { x: KNOWLEDGE_X, y: knowledgeY },
        data: knowledge as unknown as Record<string, unknown>,
        draggable: true,
      },
      // Per-tool nodes (right, stacked top to bottom)
      ...tools.map((tool, i) => ({
        id: `tool-${tool.toolId}`,
        type: "toolNode",
        position: { x: TOOLS_X, y: i * TOOL_SPACING },
        data: tool as unknown as Record<string, unknown>,
        draggable: true,
      })),
      // "Add Tool" button node (below all tool nodes)
      {
        id: "add-tool",
        type: "addToolNode",
        position: { x: TOOLS_X, y: tools.length * TOOL_SPACING },
        data: { agentId: agent.agentId },
        draggable: false,
      },
    ];

    const edges: Edge[] = [
      // Agent → Knowledge
      {
        id: "agent-knowledge",
        source: "agent",
        sourceHandle: "left",
        target: "knowledge",
        type: "dashedEdge",
      },
      // Agent → each tool node
      ...tools.map((tool) => ({
        id: `agent-tool-${tool.toolId}`,
        source: "agent",
        sourceHandle: "right",
        target: `tool-${tool.toolId}`,
        type: "dashedEdge",
      })),
      // Agent → Add Tool node
      {
        id: "agent-add-tool",
        source: "agent",
        sourceHandle: "right",
        target: "add-tool",
        type: "dashedEdge",
      },
    ];

    return { nodes, edges };
  }, [agent, knowledge, tools]);
}
