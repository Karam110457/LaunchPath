import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type {
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
} from "./canvas-types";

// React Flow expects Record<string, unknown> for node data.
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

// Vertical hierarchy: agent on top, children below
const AGENT_POS = { x: 400, y: 100 };
const CHILD_Y = 300; // vertical distance below agent
const CHILD_X_SPACING = 200; // horizontal spacing between children

export function useCanvasLayout({ agent, knowledge, tools }: LayoutInput) {
  return useMemo(() => {
    const nodes: CanvasNode[] = [];
    const edges: Edge[] = [];

    // 1. Agent node (top center)
    nodes.push({
      id: "agent",
      type: "agentNode",
      position: AGENT_POS,
      data: agent as unknown as Record<string, unknown>,
      draggable: true,
    });

    // All children: tools + knowledge, laid out horizontally below agent
    const children: { id: string; type: string; data: Record<string, unknown> }[] = [];

    tools.forEach((tool) => {
      children.push({
        id: `tool-${tool.toolId}`,
        type: "toolNode",
        data: tool as unknown as Record<string, unknown>,
      });
    });

    children.push({
      id: "knowledge",
      type: "knowledgeNode",
      data: knowledge as unknown as Record<string, unknown>,
    });

    // Center children horizontally under the agent
    const totalWidth = (children.length - 1) * CHILD_X_SPACING;
    const startX = AGENT_POS.x - totalWidth / 2 + 30; // +30 offset to center visually (agent node ~220px wide)

    children.forEach((child, i) => {
      nodes.push({
        id: child.id,
        type: child.type,
        position: {
          x: startX + i * CHILD_X_SPACING,
          y: CHILD_Y,
        },
        data: child.data,
        draggable: true,
      });

      edges.push({
        id: `agent-${child.id}`,
        source: "agent",
        sourceHandle: "bottom",
        target: child.id,
        type: "dashedEdge",
      });
    });

    return { nodes, edges };
  }, [agent, knowledge, tools]);
}
