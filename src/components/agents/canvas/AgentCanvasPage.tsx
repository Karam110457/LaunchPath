"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { SubagentNode } from "./nodes/SubagentNode";
import { DashedEdge } from "./edges/DashedEdge";
import { TopBar } from "./TopBar";
import { BottomBar } from "./BottomBar";
import { NodeModal } from "./panels/NodeModal";
import { AgentEditPanel } from "./panels/AgentEditPanel";
import { KnowledgeDetailPanel } from "./panels/KnowledgeDetailPanel";
import { SubagentEditPanel } from "./panels/SubagentEditPanel";
import { FloatingChatWidget } from "./FloatingChatWidget";
import { ToolCatalogModal } from "./panels/tools/ToolCatalogModal";
import { ToolSetupDialog } from "./panels/tools/ToolSetupDialog";
import { HttpToolSetup } from "./panels/tools/HttpToolSetup";
import { SubagentSetup } from "./panels/tools/SubagentSetup";
import { AppLibraryModal } from "./panels/tools/AppLibraryModal";
import { ComposioToolSetup } from "./panels/tools/ComposioToolSetup";
import { SaveDialog } from "./SaveDialog";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { NodeHelperTip } from "./nodes/NodeHelperTip";
import { useCanvasLayout, type SavedPositions } from "./useCanvasLayout";
import type {
  PanelState,
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
  SubagentNodeData,
  AgentFormState,
  WizardConfig,
} from "./canvas-types";
import type { AgentToolResponse, ToolType } from "@/lib/tools/types";

// Stable references for React Flow
const nodeTypes = {
  agentNode: AgentNode,
  knowledgeNode: KnowledgeNode,
  toolNode: ToolNode,
  subagentNode: SubagentNode,
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionCount, setVersionCount] = useState<number>(0);

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

  // ─── Shared payload builder ─────────────────────────────────────────────
  const buildPayload = useCallback(() => ({
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
  }), [formState]);

  // ─── Autosave (5s debounce, no version creation) ──────────────────────
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Don't autosave while the save dialog is open (manual save pending)
    if (!isDirty || !formState.name.trim() || showSaveDialog) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/agents/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...buildPayload(), skip_version: true }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          router.refresh();
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("idle");
        }
      } catch {
        setSaveStatus("idle");
      }
    }, 5000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, formState, showSaveDialog]);

  // ─── Fetch version count ────────────────────────────────────────────────
  const refreshVersionCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersionCount((data.versions ?? []).length);
      }
    } catch {
      // non-critical
    }
  }, [agent.id]);

  useEffect(() => { void refreshVersionCount(); }, [refreshVersionCount]);

  // ─── Manual save (creates a version) ──────────────────────────────────
  const handleSave = useCallback(
    async (title: string, description: string) => {
      if (!formState.name.trim()) return;
      // Cancel any pending autosave so it doesn't race with manual save
      if (autosaveRef.current) { clearTimeout(autosaveRef.current); autosaveRef.current = null; }
      setIsSaving(true);
      try {
        const res = await fetch(`/api/agents/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...buildPayload(),
            version_title: title || undefined,
            version_description: description || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Update failed");
        }
        setShowSaveDialog(false);
        toast.success(title ? `Saved: ${title}` : "Changes saved");
        router.refresh();
        void refreshVersionCount();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [agent.id, formState, router, buildPayload, refreshVersionCount]
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
      void refreshVersionCount();
    },
    [router, refreshVersionCount]
  );

  // ─── Node data ────────────────────────────────────────────────────────────
  const agentData = useMemo<AgentNodeData>(
    () => ({
      agentId: agent.id,
      name: formState.name,
      description: formState.description || null,
      model: formState.model,
      avatarEmoji: formState.avatarEmoji,
      tone: formState.tone || null,
      greetingMessage: formState.greetingMessage || null,
      systemPrompt: formState.systemPrompt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      agent.id,
      formState.name, formState.description, formState.model,
      formState.avatarEmoji, formState.tone,
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

  // ─── Subagent details state ─────────────────────────────────────────────
  interface SubagentDetail {
    id: string;
    name: string;
    description: string | null;
    personality: { avatar_emoji?: string } | null;
    status: string;
  }
  const [subagentDetails, setSubagentDetails] = useState<SubagentDetail[]>([]);

  const fetchSubagents = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/subagents`);
      if (res.ok) {
        const data = (await res.json()) as { subagents: SubagentDetail[] };
        setSubagentDetails(data.subagents);
      }
    } catch {
      // non-critical
    }
  }, [agent.id]);

  useEffect(() => { void fetchTools(); void fetchSubagents(); }, [fetchTools, fetchSubagents]);

  // Regular tool nodes (exclude subagent tools — they render as SubagentNodes)
  const toolNodeItems = useMemo<ToolNodeData[]>(
    () =>
      agentTools
        .filter((t) => t.tool_type !== "subagent")
        .map((t) => {
          const cfg = t.tool_type === "composio"
            ? (t.config as { toolkit_icon?: string; toolkit?: string })
            : null;
          return {
            toolId: t.id,
            agentId: agent.id,
            toolType: t.tool_type,
            displayName: t.display_name,
            isEnabled: t.is_enabled,
            toolkitIcon: cfg?.toolkit_icon,
            toolkitSlug: cfg?.toolkit,
          };
        }),
    [agentTools, agent.id]
  );

  // Subagent nodes — join agent_tools (subagent type) with subagent details
  const subagentNodeItems = useMemo<SubagentNodeData[]>(
    () =>
      agentTools
        .filter((t) => t.tool_type === "subagent")
        .map((t) => {
          const cfg = t.config as { target_agent_id?: string };
          const detail = subagentDetails.find((s) => s.id === cfg.target_agent_id);
          return {
            subagentId: cfg.target_agent_id ?? "",
            parentAgentId: agent.id,
            toolRecordId: t.id,
            name: detail?.name ?? t.display_name,
            avatarEmoji: detail?.personality?.avatar_emoji ?? "🤖",
            description: detail?.description ?? null,
            status: detail?.status ?? "draft",
          };
        })
        .filter((sa) => sa.subagentId),
    [agentTools, subagentDetails, agent.id]
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
    subagents: subagentNodeItems,
    savedPositions,
  });

  // Start empty — set correctly before first paint via useLayoutEffect
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  // When tools/subagents change after initial load: rebuild layout
  // New nodes get default positions; existing nodes keep their saved spot
  useEffect(() => {
    if (!toolsReady) return;
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTools, subagentDetails]);

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
  const [chatOpen, setChatOpen] = useState(false);

  // Tool dialog state
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [setupTool, setSetupTool] = useState<{
    toolType: string;
    existing?: AgentToolResponse;
  } | null>(null);
  // Composio app library + tool setup state
  const [appLibraryOpen, setAppLibraryOpen] = useState(false);
  const [composioSetup, setComposioSetup] = useState<{
    toolkit: string;
    toolkitName: string;
    toolkitIcon: string;
    connectionId: string;
    existing?: AgentToolResponse;
  } | null>(null);

  const handleToolSaved = useCallback(async () => {
    setSetupTool(null);
    setCatalogOpen(false);
    setComposioSetup(null);
    setAppLibraryOpen(false);
    await Promise.all([fetchTools(), fetchSubagents()]);
  }, [fetchTools, fetchSubagents]);

  const handleToolDeleted = useCallback(async () => {
    setSetupTool(null);
    setComposioSetup(null);
    await Promise.all([fetchTools(), fetchSubagents()]);
  }, [fetchTools, fetchSubagents]);

  const handleSubagentDeleted = useCallback(async () => {
    setModal({ type: "none" });
    await Promise.all([fetchTools(), fetchSubagents()]);
  }, [fetchTools, fetchSubagents]);

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === "agentNode") setModal({ type: "edit-agent" });
      if (node.type === "knowledgeNode") setModal({ type: "knowledge" });
      if (node.type === "subagentNode") {
        const d = node.data as unknown as SubagentNodeData;
        setModal({ type: "edit-subagent", subagentId: d.subagentId, toolRecordId: d.toolRecordId });
      }
      if (node.type === "toolNode") {
        const d = node.data as unknown as ToolNodeData;
        const existing = agentTools.find((t) => t.id === d.toolId);
        if (existing) {
          if (existing.tool_type === "composio") {
            const cfg = existing.config as {
              toolkit?: string;
              toolkit_name?: string;
              toolkit_icon?: string;
              connection_id?: string;
            };
            setComposioSetup({
              toolkit: cfg.toolkit ?? "",
              toolkitName: cfg.toolkit_name ?? existing.display_name,
              toolkitIcon: cfg.toolkit_icon ?? existing.display_name.charAt(0),
              connectionId: cfg.connection_id ?? "",
              existing,
            });
          } else {
            setSetupTool({ toolType: existing.tool_type, existing });
          }
        }
      }
    },
    [agentTools]
  );

  const handleToggleTest = useCallback(() => {
    setChatOpen((prev) => !prev);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal({ type: "none" });
  }, []);

  let modalTitle = "";
  if (modal.type === "edit-agent") modalTitle = "Edit Agent";
  else if (modal.type === "knowledge") modalTitle = "Knowledge Base";
  else if (modal.type === "edit-subagent") modalTitle = "Edit Sub-Agent";

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0a0a0a]">
      <TopBar
        agentName={formState.name}
        avatarEmoji={formState.avatarEmoji}
        onSave={() => setShowSaveDialog(true)}
        onVersionHistory={() => setShowVersionHistory(true)}
        isSaving={isSaving}
        isDirty={isDirty}
        saveStatus={saveStatus}
        versionCount={versionCount}
      />

      {/* Fixed "Add Tool" button */}
      <div className="absolute top-[60px] right-4 z-20">
        <button
          onClick={() => setCatalogOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg text-sm font-medium text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          Add Tool
        </button>
        <NodeHelperTip
          tipId="tools"
          icon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
          text="Connect 900+ apps — Gmail, Slack, CRM, and more"
          position="right-0 top-full mt-4"
        />
      </div>

      {toolsReady ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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

      <BottomBar testMode={chatOpen} onToggleTest={handleToggleTest} />

      <NodeModal
        open={modal.type !== "none"}
        onClose={handleCloseModal}
        title={modalTitle}
      >
        {modal.type === "edit-agent" && (
          <AgentEditPanel
            agentId={agent.id}
            formState={formState}
            setFormState={setFormState}
            tools={agentTools}
          />
        )}
        {modal.type === "knowledge" && (
          <KnowledgeDetailPanel
            agentId={agent.id}
            initialDocuments={initialDocuments}
            onDocumentsChange={handleDocumentsChange}
          />
        )}
        {modal.type === "edit-subagent" && (
          <SubagentEditPanel
            subagentId={modal.subagentId}
            parentAgentId={agent.id}
            toolRecordId={modal.toolRecordId}
            onDeleted={handleSubagentDeleted}
          />
        )}
      </NodeModal>

      {chatOpen && (
        <FloatingChatWidget
          agentId={agent.id}
          agentName={agent.name}
          greetingMessage={personality?.greeting_message}
          onClose={() => setChatOpen(false)}
        />
      )}

      <ToolCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={(toolType) => {
          setCatalogOpen(false);
          if (toolType === "subagent") {
            // Subagent creation uses the reworked SubagentSetup dialog
            setSetupTool({ toolType: "subagent" });
          } else {
            setSetupTool({ toolType });
          }
        }}
        existingTypes={agentTools
          .filter((t) => t.tool_type !== "subagent")
          .map((t) => t.tool_type as ToolType)}
        onAppLibrary={() => {
          setCatalogOpen(false);
          setAppLibraryOpen(true);
        }}
      />

      <AppLibraryModal
        open={appLibraryOpen}
        onClose={() => setAppLibraryOpen(false)}
        onSelectApp={(app, connection) => {
          setAppLibraryOpen(false);
          setComposioSetup({
            toolkit: app.toolkit,
            toolkitName: app.name,
            toolkitIcon: app.icon,
            connectionId: connection.id,
          });
        }}
      />

      {setupTool?.toolType === "http" && (
        <HttpToolSetup
          agentId={agent.id}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool?.toolType === "subagent" && (
        <SubagentSetup
          agentId={agent.id}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool &&
        setupTool.toolType !== "http" &&
        setupTool.toolType !== "subagent" && (
          <ToolSetupDialog
            agentId={agent.id}
            toolType={setupTool.toolType}
            existing={setupTool.existing}
            onSaved={handleToolSaved}
            onDeleted={handleToolDeleted}
            onClose={() => setSetupTool(null)}
          />
        )}

      {composioSetup && (
        <ComposioToolSetup
          agentId={agent.id}
          toolkit={composioSetup.toolkit}
          toolkitName={composioSetup.toolkitName}
          toolkitIcon={composioSetup.toolkitIcon}
          connectionId={composioSetup.connectionId}
          existing={composioSetup.existing}
          onSaved={handleToolSaved}
          onClose={() => setComposioSetup(null)}
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
