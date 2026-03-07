import { useMemo } from "react";
import type { Edge } from "@xyflow/react";
import type {
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
  SubagentTreeData,
} from "./canvas-types";

type CanvasNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  draggable: boolean;
};

export type CanvasLayoutState = {
  positions: Record<string, { x: number; y: number }>;
  edges: Edge[];
};

interface LayoutInput {
  agent: AgentNodeData;
  knowledge: KnowledgeNodeData | null;
  tools: ToolNodeData[];
  subagents: SubagentTreeData[];
  layoutState: CanvasLayoutState;
}

// ─── Node dimensions (match actual rendered sizes) ───────────────────────────
const AGENT_W = 280;
const KNOWLEDGE_W = 96;        // KnowledgeNode circle diameter
const TOOL_W = 84;             // ToolNode square side
const SUBAGENT_W = 280;        // SubagentNode width (same as AgentNode now)

// ─── Layout geometry ─────────────────────────────────────────────────────────
const HANDLE_LEFT_PCT = 0.25;
const HANDLE_RIGHT_PCT = 0.75;
const LEFT_HANDLE_X = AGENT_W * HANDLE_LEFT_PCT;   // 60
const RIGHT_HANDLE_X = AGENT_W * HANDLE_RIGHT_PCT; // 180

const ROW_GAP = 260;           // vertical gap between rows
const TOOL_H_SPACING = 160;    // center-to-center spacing between tool nodes
const CLUSTER_GAP = 100;       // horizontal gap between sub-agent clusters

// Sub-agent children layout
const SA_LEFT_HANDLE_X = SUBAGENT_W * HANDLE_LEFT_PCT;  // 60
const SA_RIGHT_HANDLE_X = SUBAGENT_W * HANDLE_RIGHT_PCT; // 180
const SA_CHILD_SPACING = 140;  // center-to-center for sub-agent children

// Place parent knowledge at x=0 so its center (48) aligns with agent's left handle
const KNOWLEDGE_X = 0;
const KNOWLEDGE_CENTER_X = KNOWLEDGE_X + KNOWLEDGE_W / 2; // 48

// Agent x: left handle must sit over knowledge center
const AGENT_X = KNOWLEDGE_CENTER_X - LEFT_HANDLE_X; // -12

// First tool x: agent right handle must sit over first tool center
const FIRST_TOOL_CENTER_X = AGENT_X + RIGHT_HANDLE_X; // 168
const FIRST_TOOL_X = FIRST_TOOL_CENTER_X - TOOL_W / 2; // 126

// Row 1 y (parent's children)
const ROW1_Y = ROW_GAP;
// Row 2 y (sub-agent's children)
const ROW2_Y = ROW_GAP + ROW_GAP;

// ─── Cluster width calculation ──────────────────────────────────────────────

function calcClusterWidth(sa: SubagentTreeData): number {
  const childCount = (sa.hasKnowledge ? 1 : 0) + sa.tools.length;
  if (childCount === 0) return SUBAGENT_W;

  // Calculate the width needed for the children row
  let childrenWidth = 0;
  if (sa.hasKnowledge) {
    childrenWidth += KNOWLEDGE_W;
    if (sa.tools.length > 0) childrenWidth += SA_CHILD_SPACING - KNOWLEDGE_W;
  }
  if (sa.tools.length > 0) {
    childrenWidth += TOOL_W;
    if (sa.tools.length > 1) {
      childrenWidth += (sa.tools.length - 1) * SA_CHILD_SPACING;
    }
  }

  return Math.max(SUBAGENT_W, childrenWidth);
}

// ─────────────────────────────────────────────────────────────────────────────

export function useCanvasLayout({ agent, knowledge, tools, subagents, layoutState }: LayoutInput) {
  return useMemo(() => {
    const positions = layoutState?.positions ?? {};
    const pos = (id: string, defaultPos: { x: number; y: number }) =>
      positions[id] ?? defaultPos;

    const nodes: CanvasNode[] = [];
    const edges: Edge[] = [...(layoutState?.edges ?? [])];

    // ─── Agent node (row 0) ──────────────────────────────────────────────
    nodes.push({
      id: "agent",
      type: "agentNode",
      position: pos("agent", { x: AGENT_X, y: 0 }),
      data: agent as unknown as Record<string, unknown>,
      draggable: true,
    });

    // ─── Parent knowledge node (row 1, conditional) ──────────────────────
    if (knowledge) {
      nodes.push({
        id: "knowledge",
        type: "knowledgeNode",
        position: pos("knowledge", { x: KNOWLEDGE_X, y: ROW1_Y }),
        data: knowledge as unknown as Record<string, unknown>,
        draggable: true,
      });
      edges.push({
        id: "agent-knowledge",
        source: "agent",
        sourceHandle: "bottom-left",
        target: "knowledge",
        type: "dashedEdge",
      });
    }

    // ─── Parent tool nodes (row 1) ───────────────────────────────────────
    tools.forEach((tool, i) => {
      const nodeId = `tool-${tool.toolId}`;
      nodes.push({
        id: nodeId,
        type: "toolNode",
        position: pos(nodeId, {
          x: FIRST_TOOL_X + i * TOOL_H_SPACING,
          y: ROW1_Y,
        }),
        data: tool as unknown as Record<string, unknown>,
        draggable: true,
      });
      // Tool edges are now manual
    });

    // ─── Sub-agent clusters (row 1 + row 2) ──────────────────────────────

    // Calculate starting x for sub-agents (after parent tools)
    const toolsEndX = tools.length > 0
      ? FIRST_TOOL_X + (tools.length - 1) * TOOL_H_SPACING + TOOL_W
      : FIRST_TOOL_CENTER_X;
    let cursorX = tools.length > 0 ? toolsEndX + CLUSTER_GAP : FIRST_TOOL_X;

    for (const sa of subagents) {
      const clusterW = calcClusterWidth(sa);
      const saId = `subagent-${sa.subagentId}`;

      // Center the sub-agent node over its cluster
      const saX = cursorX + (clusterW - SUBAGENT_W) / 2;

      nodes.push({
        id: saId,
        type: "subagentNode",
        position: pos(saId, { x: saX, y: ROW1_Y }),
        data: sa as unknown as Record<string, unknown>,
        draggable: true,
      });
      // Subagent edges are now manual

      // ── Sub-agent children (row 2) ───────────────────────────────────

      // Position children relative to sub-agent handle alignment
      // Sub-agent handle positions: left at 25%, right at 75%
      const saAbsLeftHandle = saX + SA_LEFT_HANDLE_X;
      const saAbsRightHandle = saX + SA_RIGHT_HANDLE_X;

      // Knowledge node for sub-agent
      if (sa.hasKnowledge && sa.knowledgeData) {
        const kbId = `sa-${sa.subagentId}-knowledge`;
        // Center knowledge under sub-agent's left handle
        const kbX = saAbsLeftHandle - KNOWLEDGE_W / 2;
        nodes.push({
          id: kbId,
          type: "knowledgeNode",
          position: pos(kbId, { x: kbX, y: ROW2_Y }),
          data: sa.knowledgeData as unknown as Record<string, unknown>,
          draggable: true,
        });
        edges.push({
          id: `${saId}-knowledge`,
          source: saId,
          sourceHandle: "bottom-left",
          target: kbId,
          type: "dashedEdge",
        });
      }

      // Tool nodes for sub-agent
      if (sa.tools.length > 0) {
        // Center first tool under sub-agent's right handle
        const firstToolCenterX = saAbsRightHandle;
        const firstToolX = firstToolCenterX - TOOL_W / 2;

        sa.tools.forEach((tool, i) => {
          const toolId = `sa-${sa.subagentId}-tool-${tool.toolId}`;
          nodes.push({
            id: toolId,
            type: "toolNode",
            position: pos(toolId, {
              x: firstToolX + i * SA_CHILD_SPACING,
              y: ROW2_Y,
            }),
            data: tool as unknown as Record<string, unknown>,
            draggable: true,
          });
          // Tool edges are now manual
        });
      }

      // Advance cursor past this cluster
      cursorX += clusterW + CLUSTER_GAP;
    }

    return { nodes, edges };
  }, [agent, knowledge, tools, subagents, layoutState]);
}
