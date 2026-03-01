import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type {
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
} from "./canvas-types";

// React Flow expects Record<string, unknown> for node data.
// We use a loose node type to avoid index-signature mismatches with our typed data.
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

const AGENT_POS = { x: 400, y: 300 };
const KNOWLEDGE_OFFSET = { x: 320, y: 0 };
const TOOL_X_OFFSET = -300;
const TOOL_Y_SPACING = 110;

export function useCanvasLayout({ agent, knowledge, tools }: LayoutInput) {
  return useMemo(() => {
    const nodes: CanvasNode[] = [];
    const edges: Edge[] = [];

    // 1. Agent node (center)
    nodes.push({
      id: "agent",
      type: "agentNode",
      position: AGENT_POS,
      data: agent as unknown as Record<string, unknown>,
      draggable: true,
    });

    // 2. Knowledge node (right of agent)
    nodes.push({
      id: "knowledge",
      type: "knowledgeNode",
      position: {
        x: AGENT_POS.x + KNOWLEDGE_OFFSET.x,
        y: AGENT_POS.y + KNOWLEDGE_OFFSET.y,
      },
      data: knowledge as unknown as Record<string, unknown>,
      draggable: true,
    });

    edges.push({
      id: "agent-knowledge",
      source: "agent",
      target: "knowledge",
      type: "dashedEdge",
    });

    // 3. Tool nodes (left of agent, stacked vertically)
    const totalToolHeight = (tools.length - 1) * TOOL_Y_SPACING;
    const toolStartY = AGENT_POS.y - totalToolHeight / 2;

    tools.forEach((tool, i) => {
      const nodeId = `tool-${tool.toolId}`;
      nodes.push({
        id: nodeId,
        type: "toolNode",
        position: {
          x: AGENT_POS.x + TOOL_X_OFFSET,
          y: toolStartY + i * TOOL_Y_SPACING,
        },
        data: tool as unknown as Record<string, unknown>,
        draggable: true,
      });

      edges.push({
        id: `agent-${nodeId}`,
        source: "agent",
        sourceHandle: "left",
        target: nodeId,
        type: "dashedEdge",
      });
    });

    return { nodes, edges };
  }, [agent, knowledge, tools]);
}
