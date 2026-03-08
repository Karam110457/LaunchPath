"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
  import {
    ReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Background,
    BackgroundVariant,
    addEdge,
    type Connection,
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
import { CanvasActionsContext } from "./canvas-context";
import { CanvasThemeProvider, useCanvasTheme } from "./canvas-theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LeftCatalogPanel } from "./LeftCatalogPanel";
import { useCanvasLayout, type CanvasLayoutState } from "./useCanvasLayout";
import type {
  PanelState,
  AgentNodeData,
  KnowledgeNodeData,
  ToolNodeData,
  SubagentNodeData,
  SubagentTreeData,
  AgentFormState,
  WizardConfig,
} from "./canvas-types";
import type { AgentToolResponse, ToolType } from "@/lib/tools/types";
import { useComposioConnections } from "@/hooks/useComposioConnections";

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
    canvas_layout?: any; // We parse this below
    knowledge_enabled?: boolean;
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
  const { screenToFlowPosition, getNodes, zoomIn, zoomOut, fitView } = useReactFlow();
  const { isConnected: isComposioConnected, refresh: refreshComposioConnections } = useComposioConnections();

  // ─── Agent form state ────────────────────────────────────────────────────
  // Build form state from server props
  const formStateFromProps = useCallback((): AgentFormState => ({
    name: agent.name,
    description: agent.description ?? "",
    avatarEmoji: personality?.avatar_emoji ?? "🤖",
    tone: personality?.tone ?? "",
    greetingMessage: personality?.greeting_message ?? "",
    model: agent.model,
    status: agent.status,
    systemPrompt: agent.system_prompt,
    wizardConfig: (agent.wizard_config as WizardConfig) ?? null,
  }), [agent, personality]);

  // savedFormState = the "baseline" for dirty tracking.
  // Updates from: (1) server props via router.refresh, (2) autosave, (3) revert
  const [savedFormState, setSavedFormState] = useState<AgentFormState>(formStateFromProps);

  // Sync baseline when server props change (after router.refresh() propagates)
  useEffect(() => {
    setSavedFormState(formStateFromProps());
  }, [formStateFromProps]);

  const [formState, setFormState] = useState<AgentFormState>(formStateFromProps);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [versionCount, setVersionCount] = useState<number>(0);

  const isDirty = useMemo(() => {
    return (Object.keys(savedFormState) as (keyof AgentFormState)[]).some(
      (key) => {
        if (key === "wizardConfig") {
          return JSON.stringify(formState.wizardConfig) !== JSON.stringify(savedFormState.wizardConfig);
        }
        return formState[key] !== savedFormState[key];
      }
    );
  }, [formState, savedFormState]);

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
          // Reset baseline so isDirty becomes false immediately
          setSavedFormState({ ...formState });
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

  // ─── Unified save notification (child component saves flash TopBar) ───
  const notifySaved = useCallback(() => {
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

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
      const revertedState: AgentFormState = {
        name: revertedAgent.name,
        description: revertedAgent.description ?? "",
        avatarEmoji: (revertedAgent.personality?.avatar_emoji as string) ?? "🤖",
        tone: (revertedAgent.personality?.tone as string) ?? "",
        greetingMessage: (revertedAgent.personality?.greeting_message as string) ?? "",
        model: revertedAgent.model,
        status: revertedAgent.status,
        systemPrompt: revertedAgent.system_prompt,
        wizardConfig: (revertedAgent.wizard_config as unknown as WizardConfig) ?? null,
      };
      // Update both form and baseline so isDirty = false immediately
      setFormState(revertedState);
      setSavedFormState(revertedState);
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

  // ─── Knowledge enabled state ──────────────────────────────────────────────
  const [hasKnowledge, setHasKnowledge] = useState(
    () => agent.knowledge_enabled ?? initialDocuments.length > 0
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
    knowledge_enabled?: boolean;
    tools: AgentToolResponse[];
    knowledgeCounts: { total: number; ready: number; processing: number };
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
            needsAuth: t.tool_type === "composio" && cfg?.toolkit
              ? !isComposioConnected(cfg.toolkit)
              : undefined,
          };
        }),
    [agentTools, agent.id, isComposioConnected]
  );

  // Subagent tree nodes — join agent_tools (subagent type) with enriched subagent details
  const subagentNodeItems = useMemo<SubagentTreeData[]>(
    () =>
      agentTools
        .filter((t) => t.tool_type === "subagent")
        .map((t) => {
          const cfg = t.config as { target_agent_id?: string };
          const detail = subagentDetails.find((s) => s.id === cfg.target_agent_id);
          const saTools: ToolNodeData[] = (detail?.tools ?? [])
            .filter((st) => st.tool_type !== "subagent")
            .map((st) => {
              const stCfg = st.tool_type === "composio"
                ? (st.config as { toolkit_icon?: string; toolkit?: string })
                : null;
              return {
                toolId: st.id,
                agentId: cfg.target_agent_id ?? "",
                toolType: st.tool_type,
                displayName: st.display_name,
                isEnabled: st.is_enabled,
                toolkitIcon: stCfg?.toolkit_icon,
                toolkitSlug: stCfg?.toolkit,
              };
            });
          const kbCounts = detail?.knowledgeCounts ?? { total: 0, ready: 0, processing: 0 };
          const saHasKnowledge = detail?.knowledge_enabled ?? false;
          return {
            subagentId: cfg.target_agent_id ?? "",
            parentAgentId: agent.id,
            toolRecordId: t.id,
            name: detail?.name ?? t.display_name,
            avatarEmoji: detail?.personality?.avatar_emoji ?? "🤖",
            description: detail?.description ?? null,
            status: detail?.status ?? "draft",
            tools: saTools,
            hasKnowledge: saHasKnowledge,
            knowledgeData: saHasKnowledge
              ? {
                agentId: cfg.target_agent_id ?? "",
                documentCount: kbCounts.total,
                readyCount: kbCounts.ready,
                processingCount: kbCounts.processing,
              }
              : null,
          };
        })
        .filter((sa) => sa.subagentId),
    [agentTools, subagentDetails, agent.id]
  );

  // ─── Canvas position persistence ─────────────────────────────────────────
  // Parse existing data ensuring it conforms to CanvasLayoutState
  const [layoutState, setLayoutState] = useState<CanvasLayoutState>(() => {
    const raw = agent.canvas_layout;
    if (!raw) return { positions: {}, edges: [] };
    if (raw.positions) {
      return { positions: raw.positions, edges: raw.edges || [] };
    }
    // Legacy support where it was just positions
    return { positions: raw, edges: [] };
  });
  
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistLayout = useCallback(
    (newState: CanvasLayoutState) => {
      // Debounce to avoid spamming the API during rapid drags
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void fetch(`/api/agents/${agent.id}/canvas-layout`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newState),
        });
      }, 600);
    },
    [agent.id]
  );

  // ─── Canvas layout ────────────────────────────────────────────────────────
  const { nodes: layoutNodes, edges: layoutEdges } = useCanvasLayout({
    agent: agentData,
    knowledge: hasKnowledge ? knowledgeData : null,
    tools: toolNodeItems,
    subagents: subagentNodeItems,
    layoutState,
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

  // When tools/subagents/knowledge change after initial load: rebuild layout
  // New nodes get default positions; existing nodes keep their saved spot
  useEffect(() => {
    if (!toolsReady) return;
    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTools, subagentDetails, hasKnowledge]);

  // ─── Drag end: capture new position and persist ───────────────────────────
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, _node, allNodes) => {
      const updatedPositions = { ...layoutState.positions };
      for (const n of allNodes) {
        updatedPositions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
      }
      const newState = { ...layoutState, positions: updatedPositions };
      setLayoutState(newState);
      persistLayout(newState);
    },
    [layoutState, persistLayout]
  );

  // Restrict which handles can connect to which node types
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceHandle = connection.sourceHandle;
      const targetId = connection.target;
      if (!targetId) return false;

      const targetNode = nodes.find((n) => n.id === targetId);
      if (!targetNode) return false;

      // Knowledge handle (bottom-left) → only knowledge nodes
      if (sourceHandle === "bottom-left") {
        return targetNode.type === "knowledgeNode";
      }
      // Tools handle (bottom-right) → only tool or subagent nodes
      if (sourceHandle === "bottom-right") {
        return targetNode.type === "toolNode" || targetNode.type === "subagentNode";
      }

      return true;
    },
    [nodes]
  );

  // ─── Edge ↔ tool enablement sync ─────────────────────────────────────────
  // Resolve a node ID to { agentId, toolId } for the agent_tools PATCH call.
  // Returns null for non-tool/subagent nodes (e.g. knowledge).
  const resolveToolFromNodeId = useCallback(
    (nodeId: string): { agentId: string; toolId: string } | null => {
      // Parent tool: "tool-<uuid>"
      const toolMatch = nodeId.match(/^tool-(.+)$/);
      if (toolMatch) return { agentId: agent.id, toolId: toolMatch[1] };

      // Subagent node: "subagent-<uuid>" → find the tool record linking parent → subagent
      const saMatch = nodeId.match(/^subagent-(.+)$/);
      if (saMatch) {
        const subagentId = saMatch[1];
        const toolRecord = agentTools.find(
          (t) => t.tool_type === "subagent" && (t.config as { target_agent_id?: string }).target_agent_id === subagentId
        );
        if (toolRecord) return { agentId: agent.id, toolId: toolRecord.id };
      }

      // Sub-agent's own tool: "sa-<subagentId>-tool-<toolId>"
      const saToolMatch = nodeId.match(/^sa-(.+)-tool-(.+)$/);
      if (saToolMatch) return { agentId: saToolMatch[1], toolId: saToolMatch[2] };

      return null;
    },
    [agent.id, agentTools]
  );

  const setToolEnabled = useCallback(
    (ownerAgentId: string, toolId: string, enabled: boolean) => {
      void fetch(`/api/agents/${ownerAgentId}/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: enabled }),
      });
      // Optimistically update local state
      setAgentTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, is_enabled: enabled } : t))
      );
    },
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: "dashedEdge",
      };

      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);

      // Persist edge layout
      const newState = { ...layoutState, edges: newEdges.filter(e => !e.id.includes("knowledge")) };
      setLayoutState(newState);
      persistLayout(newState);

      // Enable the tool in DB when edge is created
      const target = params.target;
      if (target) {
        const resolved = resolveToolFromNodeId(target);
        if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, true);
      }
    },
    [edges, layoutState, persistLayout, setEdges, resolveToolFromNodeId, setToolEnabled]
  );

  // Wrapper for onEdgesChange to persist deletions and disable tools
  const handleEdgesChange = useCallback(
    (changes: any) => {
      // Capture which tool nodes are being disconnected BEFORE the state changes
      const removedEdges: Edge[] = [];
      if (changes.some((c: any) => c.type === "remove")) {
        for (const change of changes) {
          if (change.type === "remove") {
            const found = edges.find((e: Edge) => e.id === change.id);
            if (found) removedEdges.push(found);
          }
        }
      }

      onEdgesChange(changes);

      // Disable tools whose edges were removed
      for (const edge of removedEdges) {
        if (edge.target) {
          const resolved = resolveToolFromNodeId(edge.target);
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);
        }
      }

      // Persist layout
      if (removedEdges.length > 0) {
        setTimeout(() => {
          setEdges((currentEdges) => {
            const newState = { ...layoutState, edges: currentEdges.filter(e => !e.id.includes("knowledge")) };
            setLayoutState(newState);
            persistLayout(newState);
            return currentEdges;
          });
        }, 0);
      }
    },
    [edges, layoutState, onEdgesChange, persistLayout, setEdges, resolveToolFromNodeId, setToolEnabled]
  );

  // Persist when edges are removed via the DashedEdge delete button (direct setEdges call)
  const prevEdgesRef = useRef<Edge[]>(edges);
  useEffect(() => {
    if (!toolsReady) return;
    const prev = prevEdgesRef.current;
    if (edges.length < prev.length) {
      // Find which edges were removed and disable those tools
      const currentIds = new Set(edges.map((e) => e.id));
      for (const edge of prev) {
        if (!currentIds.has(edge.id) && edge.target) {
          const resolved = resolveToolFromNodeId(edge.target);
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);
        }
      }

      const newState = { ...layoutState, edges: edges.filter(e => !e.id.includes("knowledge")) };
      setLayoutState(newState);
      persistLayout(newState);
    }
    prevEdgesRef.current = edges;
  }, [edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Interaction ─────────────────────────────────────────────────────────
  const [modal, setModal] = useState<PanelState>({ type: "none" });
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, toggleTheme } = useCanvasTheme();

  // Tool dialog state — scoped to a specific agent (parent or sub-agent)
  const [catalogContext, setCatalogContext] = useState<{
    agentId: string;
    hasKnowledge: boolean;
    existingToolTypes: string[];
  } | null>(null);
  const [setupTool, setSetupTool] = useState<{
    toolType: string;
    agentId: string;
    existing?: AgentToolResponse;
  } | null>(null);
  // Composio app library + tool setup state
  const [appLibraryOpen, setAppLibraryOpen] = useState(false);
  const [composioSetup, setComposioSetup] = useState<{
    agentId: string;
    toolkit: string;
    toolkitName: string;
    toolkitIcon: string;
    connectionId: string;
    existing?: AgentToolResponse;
  } | null>(null);

  const handleToolSaved = useCallback(async () => {
    // Remember which tool IDs existed before the save
    const prevToolIds = new Set(agentTools.map((t) => t.id));
    const ownerAgentId = setupTool?.agentId ?? composioSetup?.agentId ?? agent.id;

    setSetupTool(null);
    setCatalogContext(null);
    setComposioSetup(null);
    setAppLibraryOpen(false);
    await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();

    // After tools are refreshed, auto-create edges for any NEW tools
    // We need a small delay for the layout to rebuild with new tool nodes
    setTimeout(() => {
      setAgentTools((currentTools) => {
        const newTools = currentTools.filter((t) => !prevToolIds.has(t.id));
        if (newTools.length === 0) return currentTools;

        setEdges((currentEdges) => {
          let updated = [...currentEdges];
          for (const tool of newTools) {
            const nodeId = tool.tool_type === "subagent"
              ? `subagent-${(tool.config as { target_agent_id?: string }).target_agent_id}`
              : `tool-${tool.id}`;

            // Determine which agent node is the source
            const sourceNode = ownerAgentId === agent.id ? "agent" : `subagent-${ownerAgentId}`;
            const edgeId = `e-${sourceNode}-${nodeId}`;

            // Don't add duplicate
            if (!updated.some((e) => e.id === edgeId)) {
              updated = addEdge(
                { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: nodeId, type: "dashedEdge" },
                updated
              );
            }
          }

          // Persist
          const newState = { ...layoutState, edges: updated.filter(e => !e.id.includes("knowledge")) };
          setLayoutState(newState);
          persistLayout(newState);
          return updated;
        });

        return currentTools;
      });
    }, 100);
  }, [agentTools, agent.id, setupTool, composioSetup, fetchTools, fetchSubagents, notifySaved, layoutState, persistLayout, setEdges]);

  const handleToolDeleted = useCallback(async () => {
    setSetupTool(null);
    setComposioSetup(null);
    await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();
  }, [fetchTools, fetchSubagents, notifySaved]);

  const handleSubagentDeleted = useCallback(async () => {
    setModal({ type: "none" });
    await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();
  }, [fetchTools, fetchSubagents, notifySaved]);

  // Helper: find a tool record by id across parent + all sub-agents
  const findToolRecord = useCallback(
    (toolId: string, ownerAgentId: string): AgentToolResponse | undefined => {
      if (ownerAgentId === agent.id) {
        return agentTools.find((t) => t.id === toolId);
      }
      const sa = subagentDetails.find((s) => s.id === ownerAgentId);
      return sa?.tools.find((t) => t.id === toolId);
    },
    [agent.id, agentTools, subagentDetails]
  );

  const openToolSetup = useCallback(
    (existing: AgentToolResponse, ownerAgentId: string) => {
      if (existing.tool_type === "composio") {
        const cfg = existing.config as {
          toolkit?: string;
          toolkit_name?: string;
          toolkit_icon?: string;
          connection_id?: string;
        };
        setComposioSetup({
          agentId: ownerAgentId,
          toolkit: cfg.toolkit ?? "",
          toolkitName: cfg.toolkit_name ?? existing.display_name,
          toolkitIcon: cfg.toolkit_icon ?? existing.display_name.charAt(0),
          connectionId: cfg.connection_id ?? "",
          existing,
        });
      } else {
        setSetupTool({ toolType: existing.tool_type, agentId: ownerAgentId, existing });
      }
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = document.querySelector(".react-flow")?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const dataStr = event.dataTransfer.getData("application/reactflow");
    if (!dataStr) return;

    // Convert mouse event to canvas coordinate
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    try {
      const data = JSON.parse(dataStr);
      const { type, toolkit, name, icon } = data;

      // If drop is over a subagent node, create/enable for that subagent
      let targetAgentId = agent.id;
      const allNodes = getNodes();
      const hitNode = allNodes.find((n) => {
        const w = 280;
        const h = 128;
        return (
          position.x >= n.position.x &&
          position.x <= n.position.x + w &&
          position.y >= n.position.y &&
          position.y <= n.position.y + h
        );
      });
      if (hitNode?.type === "subagentNode") {
        const d = hitNode.data as unknown as SubagentNodeData;
        targetAgentId = d.subagentId;
      }

      if (type === "knowledge") {
        void (async () => {
          await fetch(`/api/agents/${targetAgentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ knowledge_enabled: true, skip_version: true }),
          });
          setHasKnowledge(true);
          // Set position for knowledge node
          const newPos = { ...layoutState.positions, "knowledge": position };
          const newState = { ...layoutState, positions: newPos };
          setLayoutState(newState);
          persistLayout(newState);
        })();
      } else if (type === "composio") {
        // Optimistic: show placeholder node instantly
        const tempId = `temp-${Date.now()}`;
        const tempNodeId = targetAgentId === agent.id ? `tool-${tempId}` : `sa-${targetAgentId}-tool-${tempId}`;
        const needsAuth = toolkit ? !isComposioConnected(toolkit) : false;
        setNodes((prev) => [
          ...prev,
          {
            id: tempNodeId,
            type: "toolNode",
            position,
            data: {
              toolId: tempId, agentId: targetAgentId,
              toolType: "composio" as ToolType, displayName: name,
              isEnabled: true, toolkitIcon: icon, toolkitSlug: toolkit,
              needsAuth,
            } as unknown as Record<string, unknown>,
            draggable: true,
          },
        ]);

        void (async () => {
          const res = await fetch(`/api/agents/${targetAgentId}/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tool_type: "composio",
              display_name: name,
              description: `Use ${name} actions.`,
              config: { toolkit, toolkit_name: name, toolkit_icon: icon },
            }),
          });
          if (!res.ok) {
            setNodes((prev) => prev.filter((n) => n.id !== tempNodeId));
            toast.error("Failed to create tool");
            return;
          }
          const json = await res.json();
          if (json.tool) {
            const realNodeId = targetAgentId === agent.id
              ? `tool-${json.tool.id}`
              : `sa-${targetAgentId}-tool-${json.tool.id}`;
            const newPos = { ...layoutState.positions, [realNodeId]: position };
            const newState = { ...layoutState, positions: newPos };
            setLayoutState(newState);
            persistLayout(newState);
          }
          await fetchTools();
          if (targetAgentId !== agent.id) await fetchSubagents();
        })();
      } else if (type === "subagent") {
        // Subagent is always added to the parent agent
        setSetupTool({ toolType: type, agentId: agent.id });
      } else if (type === "http") {
        // HTTP tools require url/method config — open setup dialog
        setSetupTool({ toolType: "http", agentId: targetAgentId });
      } else {
        // Webhook / MCP — optimistic node + create with placeholder config
        const defaultName = type === "webhook" ? "Webhook" : type === "mcp" ? "MCP Server" : "New Tool";
        const tempId = `temp-${Date.now()}`;
        const tempNodeId = targetAgentId === agent.id ? `tool-${tempId}` : `sa-${targetAgentId}-tool-${tempId}`;
        setNodes((prev) => [
          ...prev,
          {
            id: tempNodeId,
            type: "toolNode",
            position,
            data: {
              toolId: tempId, agentId: targetAgentId,
              toolType: type as ToolType, displayName: defaultName, isEnabled: true,
            } as unknown as Record<string, unknown>,
            draggable: true,
          },
        ]);

        void (async () => {
          const res = await fetch(`/api/agents/${targetAgentId}/tools`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tool_type: type,
              display_name: defaultName,
              description: "",
              config: {},
            }),
          });
          if (!res.ok) {
            setNodes((prev) => prev.filter((n) => n.id !== tempNodeId));
            toast.error("Failed to create tool");
            return;
          }
          const json = await res.json();
          if (json.tool) {
            const realNodeId = targetAgentId === agent.id
              ? `tool-${json.tool.id}`
              : `sa-${targetAgentId}-tool-${json.tool.id}`;
            const newPos = { ...layoutState.positions, [realNodeId]: position };
            const newState = { ...layoutState, positions: newPos };
            setLayoutState(newState);
            persistLayout(newState);
          }
          await fetchTools();
          if (targetAgentId !== agent.id) await fetchSubagents();
        })();
      }

    } catch (e) {
      console.error("Drop failed", e);
    }
  }, [agent.id, getNodes, screenToFlowPosition, layoutState, persistLayout, fetchTools, fetchSubagents, isComposioConnected]);

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === "agentNode") setModal({ type: "edit-agent" });
      if (node.type === "knowledgeNode") {
        const d = node.data as unknown as KnowledgeNodeData;
        if (d.agentId === agent.id) {
          setModal({ type: "knowledge" });
        } else {
          setModal({ type: "subagent-knowledge", agentId: d.agentId });
        }
      }
      if (node.type === "subagentNode") {
        const d = node.data as unknown as SubagentNodeData;
        setModal({ type: "edit-subagent", subagentId: d.subagentId, toolRecordId: d.toolRecordId });
      }
      if (node.type === "toolNode") {
        const d = node.data as unknown as ToolNodeData;
        const existing = findToolRecord(d.toolId, d.agentId);
        if (existing) openToolSetup(existing, d.agentId);
      }
    },
    [agent.id, findToolRecord, openToolSetup]
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
  else if (modal.type === "subagent-knowledge") modalTitle = "Sub-Agent Knowledge Base";
  else if (modal.type === "edit-subagent") modalTitle = "Edit Sub-Agent";

  return (
    <div className={`${theme === "dark" ? "canvas-dark" : "light"} fixed inset-0 z-[100] w-full h-full overflow-hidden ${theme === "dark" ? "bg-[#050505]" : "bg-[#eef0f2]"} text-foreground transition-colors duration-300`}>
      <TopBar
        agentName={formState.name}
        avatarEmoji={formState.avatarEmoji}
        onSave={() => setShowSaveDialog(true)}
        onVersionHistory={() => setShowVersionHistory(true)}
        onTest={handleToggleTest}
        isSaving={isSaving}
        isDirty={isDirty}
        isTestOpen={chatOpen}
        saveStatus={saveStatus}
        versionCount={versionCount}
      />

      <LeftCatalogPanel />

      {toolsReady ? (
        <CanvasActionsContext.Provider
          value={{
            openCatalogForAgent: (saId: string) => {
              const sa = subagentNodeItems.find((s) => s.subagentId === saId);
              setCatalogContext({
                agentId: saId,
                hasKnowledge: sa?.hasKnowledge ?? false,
                existingToolTypes: (sa?.tools ?? []).map((t) => t.toolType),
              });
            },
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeDragStop={onNodeDragStop}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={2}
            className="!bg-transparent"
            elementsSelectable
          >
            <Background
              variant={BackgroundVariant.Dots}
              size={1.5}
              color={theme === "dark" ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.15)"}
            />
          </ReactFlow>
        </CanvasActionsContext.Provider>
      ) : (
        // Holds space while tools are fetched — no layout jump
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 canvas-dark:border-neutral-700 border-t-neutral-500 canvas-dark:border-t-neutral-400 animate-spin" />
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-6 md:left-[320px] z-30 flex items-center gap-1 bg-white/70 canvas-dark:bg-[#1C1C1C]/70 backdrop-blur-xl border border-white/60 canvas-dark:border-[#2A2A2A]/50 shadow-sm rounded-xl p-1.5">
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
          title="Zoom In"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <div className="w-px h-4 bg-neutral-200 canvas-dark:bg-[#2A2A2A] mx-0.5" />
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
          title="Fit View"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        </button>
      </div>


      {/* Theme toggle — top-right corner */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle isDark={theme === "dark"} onToggle={toggleTheme} />
      </div>

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
            onRemoveKnowledge={async () => {
              await fetch(`/api/agents/${agent.id}/knowledge?all=true`, { method: "DELETE" });
              await fetch(`/api/agents/${agent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: false, skip_version: true }),
              });
              setHasKnowledge(false);
              handleDocumentsChange([]);
              setModal({ type: "none" });
            }}
          />
        )}
        {modal.type === "subagent-knowledge" && (
          <KnowledgeDetailPanel
            agentId={modal.agentId}
            initialDocuments={[]}
            fetchOnMount
            onRemoveKnowledge={async () => {
              await fetch(`/api/agents/${modal.agentId}/knowledge?all=true`, { method: "DELETE" });
              await fetch(`/api/agents/${modal.agentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: false, skip_version: true }),
              });
              await fetchSubagents();
              setModal({ type: "none" });
            }}
          />
        )}
        {modal.type === "edit-subagent" && (
          <SubagentEditPanel
            subagentId={modal.subagentId}
            parentAgentId={agent.id}
            toolRecordId={modal.toolRecordId}
            onDeleted={handleSubagentDeleted}
            onSaved={notifySaved}
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
        open={catalogContext !== null}
        onClose={() => setCatalogContext(null)}
        onSelect={(toolType) => {
          const ctx = catalogContext;
          if (!ctx) return;
          setCatalogContext(null);

          if (toolType === "knowledge") {
            // Enable knowledge base for the target agent
            void (async () => {
              await fetch(`/api/agents/${ctx.agentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: true, skip_version: true }),
              });
              if (ctx.agentId === agent.id) {
                setHasKnowledge(true);
                setModal({ type: "knowledge" });
              } else {
                await fetchSubagents();
                setModal({ type: "subagent-knowledge", agentId: ctx.agentId });
              }
            })();
          } else if (toolType === "subagent") {
            setSetupTool({ toolType: "subagent", agentId: ctx.agentId });
          } else {
            setSetupTool({ toolType, agentId: ctx.agentId });
          }
        }}
        existingTypes={(catalogContext?.existingToolTypes ?? []) as ToolType[]}
        hasKnowledge={catalogContext?.hasKnowledge}
        onAppLibrary={() => {
          setCatalogContext(null);
          setAppLibraryOpen(true);
        }}
      />

      <AppLibraryModal
        open={appLibraryOpen}
        onClose={() => setAppLibraryOpen(false)}
        onSelectApp={(app, connection) => {
          setAppLibraryOpen(false);
          setComposioSetup({
            agentId: catalogContext?.agentId ?? agent.id,
            toolkit: app.toolkit,
            toolkitName: app.name,
            toolkitIcon: app.icon,
            connectionId: connection.id,
          });
        }}
      />

      {setupTool?.toolType === "http" && (
        <HttpToolSetup
          agentId={setupTool.agentId}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool?.toolType === "subagent" && (
        <SubagentSetup
          agentId={setupTool.agentId}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool &&
        setupTool.toolType !== "http" &&
        setupTool.toolType !== "subagent" && (
          <ToolSetupDialog
            agentId={setupTool.agentId}
            toolType={setupTool.toolType}
            existing={setupTool.existing}
            onSaved={handleToolSaved}
            onDeleted={handleToolDeleted}
            onClose={() => setSetupTool(null)}
          />
        )}

      {composioSetup && (
        <ComposioToolSetup
          agentId={composioSetup.agentId}
          toolkit={composioSetup.toolkit}
          toolkitName={composioSetup.toolkitName}
          toolkitIcon={composioSetup.toolkitIcon}
          connectionId={composioSetup.connectionId}
          existing={composioSetup.existing}
          onSaved={handleToolSaved}
          onClose={() => setComposioSetup(null)}
          onAuthChanged={refreshComposioConnections}
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
    <CanvasThemeProvider>
      <ReactFlowProvider>
        <AgentCanvasInner {...props} />
      </ReactFlowProvider>
    </CanvasThemeProvider>
  );
}
