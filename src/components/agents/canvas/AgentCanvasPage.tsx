"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode } from "./nodes/AgentNode";
import { KnowledgeNode } from "./nodes/KnowledgeNode";
import { ToolNode } from "./nodes/ToolNode";
import { DashedEdge } from "./edges/DashedEdge";
import { TopBar } from "./TopBar";
import { BottomBar } from "./BottomBar";
import { SlidePanel } from "./panels/SlidePanel";
import { AgentDetailPanel } from "./panels/AgentDetailPanel";
import { KnowledgeDetailPanel } from "./panels/KnowledgeDetailPanel";
import { ToolDetailPanel } from "./panels/ToolDetailPanel";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { useCanvasLayout } from "./useCanvasLayout";
import type {
  PanelState,
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
} from "./canvas-types";
import type { AgentConversationMessage } from "@/lib/chat/agent-chat-types";

// Stable references for React Flow
const nodeTypes = {
  agentNode: AgentNode,
  knowledgeNode: KnowledgeNode,
  toolNode: ToolNode,
};
const edgeTypes = {
  dashedEdge: DashedEdge,
};

export interface AgentCanvasPageProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    model: string;
    status: string;
    created_at: string;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;
  tools: Array<{ tool_id: string; label: string; description: string }>;
  initialDocuments: Array<{
    id: string;
    source_type: "file" | "website" | "faq";
    source_name: string;
    chunk_count: number;
    status: "processing" | "ready" | "error";
    error_message: string | null;
    created_at: string;
  }>;
  initialChatMessages: AgentConversationMessage[];
}

function AgentCanvasInner({
  agent,
  personality,
  tools,
  initialDocuments,
  initialChatMessages,
}: AgentCanvasPageProps) {
  // Build node data
  const agentData: AgentNodeData = {
    agentId: agent.id,
    name: agent.name,
    description: agent.description,
    model: agent.model,
    status: agent.status as "draft" | "active" | "paused",
    avatarEmoji: personality?.avatar_emoji ?? "\u{1F916}",
    tone: personality?.tone ?? null,
    greetingMessage: personality?.greeting_message ?? null,
    systemPrompt: agent.system_prompt,
  };

  const knowledgeData: KnowledgeNodeData = {
    agentId: agent.id,
    documentCount: initialDocuments.length,
    readyCount: initialDocuments.filter((d) => d.status === "ready").length,
    processingCount: initialDocuments.filter((d) => d.status === "processing")
      .length,
  };

  const toolData: ToolNodeData[] = tools.map((t) => ({
    toolId: t.tool_id,
    label: t.label,
    description: t.description,
  }));

  // Layout
  const { nodes: initialNodes, edges: initialEdges } = useCanvasLayout({
    agent: agentData,
    knowledge: knowledgeData,
    tools: toolData,
  });

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Panel state
  const [panel, setPanel] = useState<PanelState>({ type: "none" });
  const [testMode, setTestMode] = useState(false);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === "agentNode") {
      setPanel({ type: "agent" });
    } else if (node.type === "knowledgeNode") {
      setPanel({ type: "knowledge" });
    } else if (node.type === "toolNode") {
      const toolId = (node.data as unknown as ToolNodeData).toolId;
      setPanel({ type: "tool", toolId });
    }
    setTestMode(false);
  }, []);

  const handleToggleTest = useCallback(() => {
    setTestMode((prev) => {
      if (!prev) setPanel({ type: "chat" });
      else setPanel({ type: "none" });
      return !prev;
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanel({ type: "none" });
    setTestMode(false);
  }, []);

  // Panel title
  let panelTitle = "";
  if (panel.type === "agent") panelTitle = "Modify Agent";
  else if (panel.type === "knowledge") panelTitle = "Knowledge Base";
  else if (panel.type === "tool")
    panelTitle = tools.find((t) => t.tool_id === panel.toolId)?.label ?? "Tool";
  else if (panel.type === "chat") panelTitle = `Test ${agent.name}`;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0a0a]">
      <TopBar
        agentName={agent.name}
        status={agent.status as "draft" | "active" | "paused"}
        avatarEmoji={personality?.avatar_emoji ?? "\u{1F916}"}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        className="!bg-transparent"
        nodesConnectable={false}
        elementsSelectable
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={1}
          color="rgba(255, 255, 255, 0.06)"
        />
      </ReactFlow>

      <BottomBar testMode={testMode} onToggleTest={handleToggleTest} />

      {/* Slide panel */}
      <SlidePanel
        open={panel.type !== "none"}
        onClose={handleClosePanel}
        title={panelTitle}
        wide={panel.type === "chat"}
      >
        {panel.type === "agent" && (
          <AgentDetailPanel agent={agent} personality={personality} />
        )}
        {panel.type === "knowledge" && (
          <KnowledgeDetailPanel
            agentId={agent.id}
            initialDocuments={initialDocuments}
          />
        )}
        {panel.type === "tool" && (
          <ToolDetailPanel
            tool={tools.find((t) => t.tool_id === panel.toolId)!}
          />
        )}
        {panel.type === "chat" && (
          <AgentChatPanel
            agentId={agent.id}
            agentName={agent.name}
            greetingMessage={personality?.greeting_message}
            initialMessages={initialChatMessages}
            embedded
          />
        )}
      </SlidePanel>
    </div>
  );
}

export function AgentCanvasPage(props: AgentCanvasPageProps) {
  return (
    <ReactFlowProvider>
      <AgentCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
