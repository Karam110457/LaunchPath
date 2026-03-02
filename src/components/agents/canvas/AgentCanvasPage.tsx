"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode } from "./nodes/AgentNode";
import { KnowledgeNode } from "./nodes/KnowledgeNode";
import { ToolNode } from "./nodes/ToolNode";
import { DashedEdge } from "./edges/DashedEdge";
import { TopBar } from "./TopBar";
import { BottomBar } from "./BottomBar";
import { NodeModal } from "./panels/NodeModal";
import { AgentEditPanel } from "./panels/AgentEditPanel";
import { KnowledgeDetailPanel } from "./panels/KnowledgeDetailPanel";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { ToolCatalogModal } from "./panels/tools/ToolCatalogModal";
import { ToolSetupDialog } from "./panels/tools/ToolSetupDialog";
import { SaveDialog } from "./SaveDialog";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { useCanvasLayout, type SavedPositions } from "./useCanvasLayout";
import type {
  PanelState,
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
  AgentFormState,
  WizardConfig,
} from "./canvas-types";
import type { AgentToolResponse, ToolType } from "@/lib/tools/types";

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
    wizard_config?: WizardConfig | null;
    canvas_layout?: SavedPositions | null;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;
  initialDocuments: Array<{
    id: string;
    source_type: "file" | "website" | "faq";
    source_name: string;
    content: string | null;
    chunk_count: number;
    status: "processing" | "ready" | "error";
    error_message: string | null;
    created_at: string;
  }>;
}

function AgentCanvasInner({
  agent,
  personality,
  initialDocuments,
}: AgentCanvasPageProps) {
  const router = useRouter();

  // ─── Agent form state ────────────────────────────────────────────────────
  const originalFormState = useMemo<AgentFormState>(
    () => ({
      name: agent.name,
      description: agent.description ?? "",
      avatarEmoji: personality?.avatar_emoji ?? "🤖",
      tone: personality?.tone ?? "",
      greetingMessage: personality?.greeting_message ?? "",
      model: agent.model,
      status: agent.status,
      systemPrompt: agent.system_prompt,
      wizardConfig: (agent.wizard_config as WizardConfig) ?? null,
    }),
    [agent, personality]
  );

  const [formState, setFormState] = useState<AgentFormState>(originalFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const isDirty = useMemo(() => {
    return (Object.keys(originalFormState) as (keyof AgentFormState)[]).some(
      (key) => {
        if (key === "wizardConfig") {
          return JSON.stringify(formState.wizardConfig) !== JSON.stringify(originalFormState.wizardConfig);
        }
        return formState[key] !== originalFormState[key];
      }
    );
  }, [formState, originalFormState]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSave = useCallback(
    async (title: string, description: string) => {
      if (!formState.name.trim()) return;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/agents/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name.trim(),
            description: formState.description.trim() || null,
            system_prompt: formState.systemPrompt,
            personality: {
              tone: formState.tone.trim() || undefined,
              greeting_message: formState.greetingMessage.trim() || undefined,
              avatar_emoji: formState.avatarEmoji.trim() || "🤖",
            },
            model: formState.model,
            status: formState.status,
            wizard_config: formState.wizardConfig,
            version_title: title || undefined,
            version_description: description || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Update failed");
        }
        setShowSaveDialog(false);
        router.refresh();
      } catch (err) {
        console.error("Save failed:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [agent.id, formState, router]
  );

  const handleReverted = useCallback(
    (revertedAgent: {
      name: string;
      description: string | null;
      system_prompt: string;
      personality: Record<string, unknown>;
      model: string;
      status: string;
      wizard_config?: Record<string, unknown> | null;
    }) => {
      setFormState(() => ({
        name: revertedAgent.name,
        description: revertedAgent.description ?? "",
        avatarEmoji: (revertedAgent.personality?.avatar_emoji as string) ?? "🤖",
        tone: (revertedAgent.personality?.tone as string) ?? "",
        greetingMessage: (revertedAgent.personality?.greeting_message as string) ?? "",
        model: revertedAgent.model,
        status: revertedAgent.status,
        systemPrompt: revertedAgent.system_prompt,
        wizardConfig: (revertedAgent.wizard_config as unknown as WizardConfig) ?? null,
      }));
      router.refresh();
    },
    [router]
  );

  // ─── Node data ────────────────────────────────────────────────────────────
  const agentData = useMemo<AgentNodeData>(
    () => ({
      agentId: agent.id,
      name: formState.name,
      description: formState.description || null,
      model: formState.model,
      status: formState.status as "draft" | "active" | "paused",
      avatarEmoji: formState.avatarEmoji,
      tone: formState.tone || null,
      greetingMessage: formState.greetingMessage || null,
      systemPrompt: formState.systemPrompt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      agent.id,
      formState.name, formState.description, formState.model,
      formState.status, formState.avatarEmoji, formState.tone,
      formState.greetingMessage, formState.systemPrompt,
    ]
  );

  const [docCounts, setDocCounts] = useState({
    total: initialDocuments.length,
    ready: initialDocuments.filter((d) => d.status === "ready").length,
    processing: initialDocuments.filter((d) => d.status === "processing").length,
  });

  const handleDocumentsChange = useCallback(
    (docs: Array<{ status: string }>) => {
      setDocCounts({
        total: docs.length,
        ready: docs.filter((d) => d.status === "ready").length,
        processing: docs.filter((d) => d.status === "processing").length,
      });
    },
    []
  );

  const knowledgeData = useMemo<KnowledgeNodeData>(
    () => ({
      agentId: agent.id,
      documentCount: docCounts.total,
      readyCount: docCounts.ready,
      processingCount: docCounts.processing,
    }),
    [agent.id, docCounts.total, docCounts.ready, docCounts.processing]
  );

  // ─── Tools state ──────────────────────────────────────────────────────────
  const [agentTools, setAgentTools] = useState<AgentToolResponse[]>([]);
  // Block canvas render until first tools fetch completes (prevents layout jump)
  const [toolsReady, setToolsReady] = useState(false);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/tools`);
      if (res.ok) {
        const data = (await res.json()) as { tools: AgentToolResponse[] };
        setAgentTools(data.tools);
      }
    } catch {
      // non-critical
    } finally {
      setToolsReady(true);
    }
  }, [agent.id]);

  useEffect(() => { void fetchTools(); }, [fetchTools]);

  const toolNodeItems = useMemo<ToolNodeData[]>(
    () =>
      agentTools.map((t) => ({
        toolId: t.id,
        agentId: agent.id,
        toolType: t.tool_type,
        displayName: t.display_name,
        isEnabled: t.is_enabled,
      })),
    [agentTools, agent.id]
  );

  // ─── Canvas position persistence ─────────────────────────────────────────
  // Initialise from the server-fetched canvas_layout (persisted positions)
  const [savedPositions, setSavedPositions] = useState<SavedPositions>(
    (agent.canvas_layout as SavedPositions) ?? {}
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistPositions = useCallback(
    (positions: SavedPositions) => {
      // Debounce to avoid spamming the API during rapid drags
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void fetch(`/api/agents/${agent.id}/canvas-layout`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positions }),
        });
      }, 600);
    },
    [agent.id]
  );

  // ─── Canvas layout ────────────────────────────────────────────────────────
  const { nodes: layoutNodes, edges: layoutEdges } = useCanvasLayout({
    agent: agentData,
    knowledge: knowledgeData,
    tools: toolNodeItems,
    savedPositions,
  });

  // Start empty — set correctly before first paint via useLayoutEffect
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // When toolsReady flips true: set the correct layout synchronously before
  // the browser paints, so ReactFlow never renders with a stale/empty layout
  useLayoutEffect(() => {
    if (!toolsReady) return;
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsReady]);

  // Update agent node data in-place (preserves position)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === "agentNode"
          ? { ...n, data: agentData as unknown as Record<string, unknown> }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData]);

  // Update knowledge node data in-place (preserves position)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === "knowledgeNode"
          ? { ...n, data: knowledgeData as unknown as Record<string, unknown> }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docCounts]);

  // When tools change after initial load: rebuild layout with saved positions
  // New tool nodes get default positions; existing nodes keep their saved spot
  useEffect(() => {
    if (!toolsReady) return;
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTools]);

  // ─── Drag end: capture new position and persist ───────────────────────────
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, _node, allNodes) => {
      const updated: SavedPositions = { ...savedPositions };
      for (const n of allNodes) {
        updated[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
      }
      setSavedPositions(updated);
      persistPositions(updated);
    },
    [savedPositions, persistPositions]
  );

  // ─── Interaction ─────────────────────────────────────────────────────────
  const [modal, setModal] = useState<PanelState>({ type: "none" });
  const [testMode, setTestMode] = useState(false);

  // Tool dialog state
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [setupTool, setSetupTool] = useState<{
    toolType: string;
    existing?: AgentToolResponse;
  } | null>(null);

  const handleToolSaved = useCallback(async () => {
    setSetupTool(null);
    setCatalogOpen(false);
    await fetchTools();
  }, [fetchTools]);

  const handleToolDeleted = useCallback(async () => {
    setSetupTool(null);
    await fetchTools();
  }, [fetchTools]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === "knowledgeNode") {
        setModal({ type: "knowledge" });
      }
      if (node.type === "toolNode") {
        const d = node.data as unknown as ToolNodeData;
        const existing = agentTools.find((t) => t.id === d.toolId);
        if (existing) setSetupTool({ toolType: existing.tool_type, existing });
      }
    },
    [agentTools]
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === "agentNode") setModal({ type: "edit-agent" });
  }, []);

  const handleToggleTest = useCallback(() => {
    setTestMode((prev) => {
      if (!prev) setModal({ type: "chat" });
      else setModal({ type: "none" });
      return !prev;
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal({ type: "none" });
    setTestMode(false);
  }, []);

  let modalTitle = "";
  if (modal.type === "edit-agent") modalTitle = "Edit Agent";
  else if (modal.type === "knowledge") modalTitle = "Knowledge Base";
  else if (modal.type === "chat") modalTitle = `Test ${agent.name}`;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0a0a]">
      <TopBar
        agentName={formState.name}
        status={formState.status as "draft" | "active" | "paused"}
        avatarEmoji={formState.avatarEmoji}
        onSave={() => setShowSaveDialog(true)}
        onVersionHistory={() => setShowVersionHistory(true)}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      {/* Fixed "Add Tool" button */}
      <button
        onClick={() => setCatalogOpen(true)}
        className="absolute top-[60px] right-4 z-20 flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg text-sm font-medium text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4 text-amber-400" />
        Add Tool
      </button>

      {toolsReady ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
          className="!bg-transparent"
          nodesConnectable={false}
          elementsSelectable
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="rgba(255, 255, 255, 0.15)"
          />
        </ReactFlow>
      ) : (
        // Holds space while tools are fetched — no layout jump
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
        </div>
      )}

      <BottomBar testMode={testMode} onToggleTest={handleToggleTest} />

      <NodeModal
        open={modal.type !== "none"}
        onClose={handleCloseModal}
        title={modalTitle}
        size={modal.type === "chat" ? "chat" : "default"}
      >
        {modal.type === "edit-agent" && (
          <AgentEditPanel
            agentId={agent.id}
            formState={formState}
            setFormState={setFormState}
          />
        )}
        {modal.type === "knowledge" && (
          <KnowledgeDetailPanel
            agentId={agent.id}
            initialDocuments={initialDocuments}
            onDocumentsChange={handleDocumentsChange}
          />
        )}
        {modal.type === "chat" && (
          <AgentChatPanel
            agentId={agent.id}
            agentName={agent.name}
            greetingMessage={personality?.greeting_message}
            embedded
          />
        )}
      </NodeModal>

      <ToolCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={(toolType) => {
          setCatalogOpen(false);
          setSetupTool({ toolType });
        }}
        existingTypes={agentTools.map((t) => t.tool_type as ToolType)}
      />

      {setupTool && (
        <ToolSetupDialog
          agentId={agent.id}
          toolType={setupTool.toolType}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onDeleted={handleToolDeleted}
          onClose={() => setSetupTool(null)}
        />
      )}

      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <VersionHistoryModal
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        agentId={agent.id}
        isDirty={isDirty}
        onReverted={handleReverted}
      />
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
