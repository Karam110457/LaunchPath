import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type { AgentNodeData, KnowledgeNodeData } from "./canvas-types";

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
}

// Vertical hierarchy: agent on top, knowledge below
const AGENT_POS = { x: 400, y: 100 };
const KNOWLEDGE_POS = { x: 430, y: 300 };

export function useCanvasLayout({ agent, knowledge }: LayoutInput) {
  return useMemo(() => {
    const nodes: CanvasNode[] = [
      {
        id: "agent",
        type: "agentNode",
        position: AGENT_POS,
        data: agent as unknown as Record<string, unknown>,
        draggable: true,
      },
      {
        id: "knowledge",
        type: "knowledgeNode",
        position: KNOWLEDGE_POS,
        data: knowledge as unknown as Record<string, unknown>,
        draggable: true,
      },
    ];

    const edges: Edge[] = [
      {
        id: "agent-knowledge",
        source: "agent",
        sourceHandle: "bottom",
        target: "knowledge",
        type: "dashedEdge",
      },
    ];

    return { nodes, edges };
  }, [agent, knowledge]);
}
