"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
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

// ─── Stable node/edge type maps ──────────────────────────────────────────────
const nodeTypes = {
  agentNode: AgentNode,
  knowledgeNode: KnowledgeNode,
  toolNode: ToolNode,
};
const edgeTypes = {
  dashedEdge: DashedEdge,
};

// ─── CanvasFlow ───────────────────────────────────────────────────────────────
// Separate component so useNodesState is initialised with the correct nodes
// on first mount (instead of an empty array that causes a position animation).
// Only rendered once toolsReady=true, at which point initialNodes/initialEdges
// already contain the full layout.

interface CanvasFlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  agentData: AgentNodeData;
  knowledgeData: KnowledgeNodeData;
  agentTools: AgentToolResponse[];
  toolNodeItems: ToolNodeData[];
  savedPositions: SavedPositions;
  onNodeDragStop: OnNodeDrag;
  onNodeClick: NodeMouseHandler;
  onNodeDoubleClick: NodeMouseHandler;
  onReady: () => void;
}

function CanvasFlow({
  initialNodes,
  initialEdges,
  agentData,
  knowledgeData,
  agentTools,
  toolNodeItems,
  savedPositions,
  onNodeDragStop,
  onNodeClick,
  onNodeDoubleClick,
  onReady,
}: CanvasFlowProps) {
  // Initialised with correct nodes — no position jump on first paint
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // ─── Reveal after React Flow finishes its internal setup ─────────────────
  // React Flow runs fitView via ResizeObserver (node measurement) which fires
  // 1-2 frames after mount. We hide the canvas until that cycle is done so
  // the user never sees the pre-fitView "squished" state.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let raf1: number, raf2: number;
    // Two frames: frame 1 lets ResizeObserver fire, frame 2 lets fitView settle
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setIsReady(true);
        onReady();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []); // run once on mount

  // Recompute layout whenever tools or saved positions change
  const { nodes: layoutNodes, edges: layoutEdges } = useCanvasLayout({
    agent: agentData,
    knowledge: knowledgeData,
    tools: toolNodeItems,
    savedPositions,
  });

  // Update agent node data in-place (preserves dragged position)
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

  // Update knowledge node data in-place (preserves dragged position)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === "knowledgeNode"
          ? { ...n, data: knowledgeData as unknown as Record<string, unknown> }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeData]);

  // When tools are added/removed after initial mount: rebuild the full layout
  // (new nodes get default positions; existing nodes keep their saved positions)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return; // skip first run — initialNodes already correct
    }
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTools]);

  return (
    // opacity wrapper: hides the pre-fitView initialization state, then
    // fades in cleanly once React Flow has settled (2 animation frames)
    <div
      className="w-full h-full"
      style={{
        opacity: isReady ? 1 : 0,
        transition: isReady ? "opacity 0.18s ease" : "none",
      }}
    >
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
    </div>
  );
}

// ─── AgentCanvasPageProps ─────────────────────────────────────────────────────

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

// ─── AgentCanvasInner ─────────────────────────────────────────────────────────

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

  // ─── Tools + canvas readiness ────────────────────────────────────────────
  const [agentTools, setAgentTools] = useState<AgentToolResponse[]>([]);
  const [toolsReady, setToolsReady] = useState(false);
  // canvasReady flips true once CanvasFlow's 2-frame delay resolves
  const [canvasReady, setCanvasReady] = useState(false);
  const handleCanvasReady = useCallback(() => setCanvasReady(true), []);

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

  // ─── Position persistence ─────────────────────────────────────────────────
  const [savedPositions, setSavedPositions] = useState<SavedPositions>(
    (agent.canvas_layout as SavedPositions) ?? {}
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistPositions = useCallback(
    (positions: SavedPositions) => {
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

  // ─── Initial layout (computed once when toolsReady flips true) ────────────
  // Used as the initialNodes/initialEdges for CanvasFlow on its first mount.
  // After that, CanvasFlow manages its own internal node state.
  const { nodes: layoutNodes, edges: layoutEdges } = useCanvasLayout({
    agent: agentData,
    knowledge: knowledgeData,
    tools: toolNodeItems,
    savedPositions,
  });

  // ─── Drag: capture positions and persist ─────────────────────────────────
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

      <button
        onClick={() => setCatalogOpen(true)}
        className="absolute top-[60px] right-4 z-20 flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg text-sm font-medium text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4 text-amber-400" />
        Add Tool
      </button>

      {/* Spinner: visible until tools are fetched AND React Flow has fully
          settled (fitView + ResizeObserver complete). Crossfades with canvas. */}
      {!canvasReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
        </div>
      )}

      {/* Mount CanvasFlow once tools are loaded so useNodesState gets the
          correct initial nodes. CanvasFlow hides itself (opacity:0) during
          React Flow's 2-frame init cycle, then fades in via onReady. */}
      {toolsReady && (
        <CanvasFlow
          initialNodes={layoutNodes as Node[]}
          initialEdges={layoutEdges}
          agentData={agentData}
          knowledgeData={knowledgeData}
          agentTools={agentTools}
          toolNodeItems={toolNodeItems}
          savedPositions={savedPositions}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onReady={handleCanvasReady}
        />
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
