"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
  import {
    ReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    useReactFlow,
    useUpdateNodeInternals,
    Background,
    BackgroundVariant,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    type NodeMouseHandler,
    type OnNodeDrag,
    type NodeChange,
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
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { Undo2, Redo2 } from "lucide-react";
import { CanvasActionsContext } from "./canvas-context";
import { CanvasThemeProvider, useCanvasTheme } from "./canvas-theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LeftCatalogPanel } from "./LeftCatalogPanel";
import { generateConfigDirectives, updatePromptDirectives } from "@/lib/agents/config-directives";
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

function buildFormChangeLabel(old: AgentFormState, next: AgentFormState): string {
  if (old.name !== next.name) return `Changed name to "${next.name}"`;
  if (old.tone !== next.tone) return `Changed tone`;
  if (old.language !== next.language) return `Changed language`;
  if (old.model !== next.model) return `Changed model`;
  if (old.greetingMessage !== next.greetingMessage) return "Changed greeting message";
  if (old.systemPrompt !== next.systemPrompt) return "Changed system prompt";
  if (old.description !== next.description) return "Changed description";
  return "Changed agent settings";
}

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

/** Get a human-readable name from a canvas node for toasts/undo labels. */
function getNodeDisplayName(node: Node): string {
  if (node.type === "toolNode") return (node.data as unknown as ToolNodeData).displayName;
  if (node.type === "subagentNode") return (node.data as unknown as SubagentNodeData).name;
  if (node.type === "knowledgeNode") return "Knowledge Base";
  if (node.type === "agentNode") return (node.data as unknown as AgentNodeData).name;
  return node.id;
}

export interface AgentCanvasPageProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    model: string;
    created_at: string;
    wizard_config?: WizardConfig | null;
    voice_config?: import("@/lib/channels/types").AgentVoiceSettings | null;
    canvas_layout?: any; // We parse this below
    knowledge_enabled?: boolean;
    tool_guidelines?: string | null;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
    language?: string;
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
  const { isConnected: isComposioConnected, refresh: refreshComposioConnections, loading: composioConnectionsLoading } = useComposioConnections();

  // ─── Agent form state ────────────────────────────────────────────────────
  // Build form state from server props
  const formStateFromProps = useCallback((): AgentFormState => ({
    name: agent.name,
    description: agent.description ?? "",
    tone: personality?.tone ?? "",
    greetingMessage: personality?.greeting_message ?? "",
    language: personality?.language ?? "en",
    model: agent.model,
    systemPrompt: agent.system_prompt,
    wizardConfig: (agent.wizard_config as WizardConfig) ?? null,
    voiceConfig: (agent.voice_config as import("@/lib/channels/types").AgentVoiceSettings) ?? null,
  }), [agent, personality]);

  // savedFormState = the "baseline" for dirty tracking.
  // Updates from: (1) server props via router.refresh, (2) autosave, (3) revert
  const [savedFormState, setSavedFormState] = useState<AgentFormState>(formStateFromProps);

  // Sync baseline when server props change (after router.refresh() propagates)
  useEffect(() => {
    setSavedFormState(formStateFromProps());
  }, [formStateFromProps]);

  const [formState, setFormState] = useState<AgentFormState>(formStateFromProps);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ─── Sync config directives into systemPrompt when Basics fields change ─
  // When wizardConfig or personality-related fields change, regenerate the
  // Configuration Directives section in the system prompt so it's visible
  // on the Advanced (Prompt) tab.
  const directivesSourceRef = useRef<string>(""); // tracks last-generated directives fingerprint
  useEffect(() => {
    const wc = formState.wizardConfig;
    const newDirectives = generateConfigDirectives({
      personality: {
        tone: formState.tone,
        greeting_message: formState.greetingMessage,
        language: formState.language,
      },
      wizardConfig: wc ? {
        templateId: wc.templateId,
        qualifyingQuestions: wc.qualifyingQuestions,
        behaviorConfig: wc.behaviorConfig,
      } : null,
      toolGuidelines: agent.tool_guidelines ?? undefined,
    });

    // Fingerprint to avoid infinite loops: only update if directives actually changed
    const fingerprint = newDirectives;
    if (fingerprint === directivesSourceRef.current) return;
    directivesSourceRef.current = fingerprint;

    setFormState((prev) => {
      const updated = updatePromptDirectives(prev.systemPrompt, newDirectives);
      if (updated === prev.systemPrompt) return prev;
      return { ...prev, systemPrompt: updated };
    });
  }, [
    formState.wizardConfig,
    formState.tone,
    formState.greetingMessage,
    formState.language,
    agent.wizard_config,
  ]);

  const isDirty = useMemo(() => {
    return (Object.keys(savedFormState) as (keyof AgentFormState)[]).some(
      (key) => {
        if (key === "wizardConfig" || key === "voiceConfig") {
          return JSON.stringify(formState[key]) !== JSON.stringify(savedFormState[key]);
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
      language: formState.language || undefined,
    },
    model: formState.model,
    wizard_config: formState.wizardConfig,
    voice_config: formState.voiceConfig,
  }), [formState]);

  // ─── Autosave (5s debounce, no version creation) ──────────────────────
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Don't autosave while the save dialog is open (manual save pending)
    if (!isDirty || !formState.name.trim()) return;
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
  }, [isDirty, formState]);

  // ─── Unified save notification (child component saves flash TopBar) ───
  const notifySaved = useCallback(() => {
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  // ─── Back button: flush autosave then navigate ────────────────────────
  const handleBack = useCallback(async () => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
      autosaveRef.current = null;
    }
    if (isDirty && formState.name.trim()) {
      setSaveStatus("saving");
      await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), skip_version: true }),
      });
    }
    router.push("/dashboard/agents");
  }, [isDirty, formState, agent.id, buildPayload, router]);

  // ─── Undo / Redo ──────────────────────────────────────────────────────
  const { push: pushUndo, undo, redo, clear: clearUndo, canUndo, canRedo, undoLabel, redoLabel } = useUndoRedo();
  const isUndoingRef = useRef(false);
  const editingToolSnapshotRef = useRef<AgentToolResponse | null>(null);

  // Inline status pill (replaces sonner toast for undo/redo feedback)
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [undoToastFading, setUndoToastFading] = useState(false);
  const undoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoToastFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showUndoToast = useCallback((msg: string) => {
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current);
    if (undoToastFadeRef.current) clearTimeout(undoToastFadeRef.current);
    setUndoToastFading(false);
    setUndoToast(msg);
    undoToastTimerRef.current = setTimeout(() => {
      setUndoToastFading(true);
      undoToastFadeRef.current = setTimeout(() => {
        setUndoToast(null);
        setUndoToastFading(false);
      }, 300);
    }, 1500);
  }, []);

  // Debounced formState undo tracking (1s debounce batches keystrokes)
  const lastPushedFormRef = useRef<AgentFormState>(formState);
  const formUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isUndoingRef.current) { lastPushedFormRef.current = { ...formState }; return; }
    if (formUndoTimerRef.current) clearTimeout(formUndoTimerRef.current);
    formUndoTimerRef.current = setTimeout(() => {
      const oldSnapshot = { ...lastPushedFormRef.current };
      const newSnapshot = { ...formState };
      const changed = (Object.keys(oldSnapshot) as (keyof AgentFormState)[]).some((key) => {
        if (key === "wizardConfig") return JSON.stringify(oldSnapshot.wizardConfig) !== JSON.stringify(newSnapshot.wizardConfig);
        return oldSnapshot[key] !== newSnapshot[key];
      });
      if (!changed) return;
      const label = buildFormChangeLabel(oldSnapshot, newSnapshot);
      pushUndo({
        label,
        undo: () => {
          isUndoingRef.current = true;
          setFormState(oldSnapshot);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
        redo: () => {
          isUndoingRef.current = true;
          setFormState(newSnapshot);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
      });
      lastPushedFormRef.current = newSnapshot;
    }, 1000);
    return () => { if (formUndoTimerRef.current) clearTimeout(formUndoTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo) {
          const label = redoLabel;
          void redo().then(ok => showUndoToast(ok ? `Redone: ${label}` : `Redo failed: ${label}`));
        }
      } else {
        if (canUndo) {
          const label = undoLabel;
          void undo().then(ok => showUndoToast(ok ? `Undone: ${label}` : `Undo failed: ${label}`));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, canRedo, undo, redo, undoLabel, redoLabel, showUndoToast]);

  // ─── Node data ────────────────────────────────────────────────────────────
  const agentData = useMemo<AgentNodeData>(
    () => ({
      agentId: agent.id,
      name: formState.name,
      description: formState.description || null,
      model: formState.model,
      tone: formState.tone || null,
      greetingMessage: formState.greetingMessage || null,
      systemPrompt: formState.systemPrompt,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      agent.id,
      formState.name, formState.description, formState.model,
      formState.tone,
      formState.greetingMessage, formState.systemPrompt,
    ]
  );

  // ─── Knowledge enabled state ──────────────────────────────────────────────
  const [hasKnowledge, setHasKnowledge] = useState(
    () => agent.knowledge_enabled || initialDocuments.length > 0
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

  // Poll for knowledge doc status when there are docs still processing.
  // This handles the case where KB processing runs after the redirect.
  useEffect(() => {
    if (docCounts.processing <= 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/agents/${agent.id}/knowledge/status`);
        if (!res.ok) return;
        const docs = (await res.json()) as Array<{ status: string }>;
        const newProcessing = docs.filter((d) => d.status === "processing").length;
        setDocCounts({
          total: docs.length,
          ready: docs.filter((d) => d.status === "ready").length,
          processing: newProcessing,
        });
        if (docs.length > 0) setHasKnowledge(true);
        if (newProcessing === 0) clearInterval(interval);
      } catch {
        // Ignore — will retry on next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [agent.id, docCounts.processing]);

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

  const fetchTools = useCallback(async (): Promise<AgentToolResponse[]> => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/tools`);
      if (res.ok) {
        const data = (await res.json()) as { tools: AgentToolResponse[] };
        setAgentTools(data.tools);
        return data.tools;
      }
    } catch {
      // non-critical
    } finally {
      setToolsReady(true);
    }
    return [];
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

  const fetchSubagents = useCallback(async (): Promise<SubagentDetail[]> => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/subagents`);
      if (res.ok) {
        const data = (await res.json()) as { subagents: SubagentDetail[] };
        setSubagentDetails(data.subagents);
        return data.subagents;
      }
    } catch {
      // non-critical
    }
    return [];
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
              ? (composioConnectionsLoading ? false : !isComposioConnected(cfg.toolkit))
              : undefined,
          };
        }),
    [agentTools, agent.id, isComposioConnected, composioConnectionsLoading]
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
                needsAuth: st.tool_type === "composio" && stCfg?.toolkit
                  ? (composioConnectionsLoading ? false : !isComposioConnected(stCfg.toolkit))
                  : undefined,
              };
            });
          const kbCounts = detail?.knowledgeCounts ?? { total: 0, ready: 0, processing: 0 };
          const saHasKnowledge = detail?.knowledge_enabled ?? false;
          return {
            subagentId: cfg.target_agent_id ?? "",
            parentAgentId: agent.id,
            toolRecordId: t.id,
            name: detail?.name ?? t.display_name,
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
    [agentTools, subagentDetails, agent.id, isComposioConnected, composioConnectionsLoading]
  );

  // Canvas summary for TopBar: sub-agent count + total tool count (main + all sub-agents)
  const canvasSummary = useMemo(
    () => ({
      subagentCount: subagentNodeItems.length,
      toolCount:
        toolNodeItems.length +
        subagentNodeItems.reduce((sum, sa) => sum + sa.tools.length, 0),
    }),
    [subagentNodeItems, toolNodeItems]
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
  
  // Ref mirrors layoutState for use in callbacks (avoids stale closures)
  const layoutStateRef = useRef(layoutState);
  layoutStateRef.current = layoutState;

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

  // Ref mirrors layoutEdges for use in merge useEffect (avoids dependency cascade)
  const layoutEdgesRef = useRef(layoutEdges);
  layoutEdgesRef.current = layoutEdges;

  // Start empty — set correctly before first paint via useLayoutEffect
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Ref mirrors edges for use in callbacks (avoids stale closures)
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // ─── Animated node removal ────────────────────────────────────────────────
  // Must match NODE_EXIT.transition.duration (250ms) in animation-constants.ts
  const ANIMATED_EXIT_MS = 200;

  // Wrapper for onNodesChange: intercept "remove" changes, mark nodes as
  // _exiting so they animate out, then actually remove after the animation.
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removeIds: string[] = [];
      const otherChanges: NodeChange[] = [];

      for (const change of changes) {
        if (change.type === "remove") {
          removeIds.push(change.id);
        } else {
          otherChanges.push(change);
        }
      }

      // Apply non-remove changes immediately
      if (otherChanges.length > 0) {
        onNodesChange(otherChanges);
      }

      if (removeIds.length === 0) return;

      // Mark nodes as exiting (triggers NODE_EXIT animation in the component)
      setNodes((prev) =>
        prev.map((n) =>
          removeIds.includes(n.id)
            ? { ...n, selectable: false, draggable: false, data: { ...n.data, _exiting: true } }
            : n
        )
      );

      // After animation completes, actually remove them
      setTimeout(() => {
        setNodes((prev) => prev.filter((n) => !removeIds.includes(n.id)));
      }, ANIMATED_EXIT_MS);
    },
    [onNodesChange, setNodes]
  );

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

  // Update parent knowledge node data in-place (preserves position)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "knowledge"
          ? { ...n, data: knowledgeData as unknown as Record<string, unknown> }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docCounts]);

  // When tools/subagents/knowledge change after initial load: rebuild layout.
  // IMPORTANT: merges nodes in-place (data only) to avoid full re-mount /
  // animation replay.  New nodes are added, removed nodes animate out,
  // edges are only replaced when structurally necessary.
  useEffect(() => {
    if (!toolsReady) return;

    const layoutNodeIds = new Set(layoutNodes.map((n) => n.id));
    const layoutMap = new Map(layoutNodes.map((n) => [n.id, n]));
    let hasRemovals = false;

    // Merge nodes: update existing data in-place, add new, animate removed
    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const result: Node[] = [];

      // 1. Update existing nodes (preserve position + internal state, update data)
      for (const n of currentNodes) {
        if ((n.data as Record<string, unknown>)._exiting) {
          // Already exiting: keep as-is
          result.push(n);
          continue;
        }
        const layoutNode = layoutMap.get(n.id);
        if (layoutNode) {
          // Exists in layout: update data only
          result.push({ ...n, data: layoutNode.data });
        } else {
          // Being removed: animate exit
          hasRemovals = true;
          result.push({
            ...n,
            selectable: false,
            draggable: false,
            data: { ...n.data, _exiting: true },
          });
        }
      }

      // 2. Add new nodes not in current
      for (const ln of layoutNodes) {
        if (!currentIds.has(ln.id)) {
          result.push(ln);
        }
      }

      return result;
    });

    // Clean up exiting nodes after animation completes
    if (hasRemovals) {
      setTimeout(() => {
        setNodes((prev) => prev.filter((n) => !(n.data as Record<string, unknown>)._exiting));
      }, ANIMATED_EXIT_MS);
    }

    // ── Edge sync: remove stale edges + sync auto-generated knowledge edges ──
    // Knowledge edges are auto-generated by useCanvasLayout (not persisted),
    // so they must be synced whenever hasKnowledge changes for any agent.
    const nodeIds = layoutNodeIds;
    const layoutKnowledgeEdges = layoutEdgesRef.current.filter(e => e.id.endsWith("-knowledge"));
    const layoutKnowledgeIds = new Set(layoutKnowledgeEdges.map(e => e.id));

    setEdges((currentEdges) => {
      let updated = [...currentEdges];

      // 1. Remove stale edges pointing to deleted nodes
      updated = updated.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

      // 2. Remove knowledge edges no longer in layout (e.g. knowledge disabled)
      updated = updated.filter(e => !e.id.endsWith("-knowledge") || layoutKnowledgeIds.has(e.id));

      // 3. Add missing knowledge edges from layout (e.g. knowledge just enabled)
      const currentIds = new Set(updated.map(e => e.id));
      for (const ke of layoutKnowledgeEdges) {
        if (!currentIds.has(ke.id)) {
          updated.push(ke);
        }
      }

      // 4. Auto-create edges for ENABLED tool/subagent nodes that have no connection
      //    (e.g. tools auto-added by the wizard generate route).
      //    Disabled tools (dragged from catalog but not yet connected) get no edge.
      const connectedTargets = new Set(updated.map(e => e.target));
      for (const ln of layoutNodes) {
        const d = ln.data as Record<string, unknown>;
        const isEnabled = d.isEnabled === true;
        if (ln.id.startsWith("tool-") && isEnabled && !connectedTargets.has(ln.id)) {
          const edgeId = `e-agent-${ln.id}`;
          if (!currentIds.has(edgeId)) {
            updated.push({ id: edgeId, source: "agent", sourceHandle: "bottom-right", target: ln.id, type: "dashedEdge" });
          }
        } else if (ln.id.startsWith("subagent-") && !connectedTargets.has(ln.id)) {
          const edgeId = `e-agent-${ln.id}`;
          if (!currentIds.has(edgeId)) {
            updated.push({ id: edgeId, source: "agent", sourceHandle: "bottom-right", target: ln.id, type: "dashedEdge" });
          }
        }
      }

      // No-op check: avoid unnecessary re-renders
      if (updated.length === currentEdges.length && updated.every((e, i) => e.id === currentEdges[i]?.id)) {
        return currentEdges;
      }

      // Persist non-knowledge edges
      const ls = layoutStateRef.current;
      const newState = { ...ls, edges: updated.filter(e => !e.id.endsWith("-knowledge")) };
      setLayoutState(newState);
      persistLayout(newState);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTools, subagentDetails, hasKnowledge, layoutNodes]);

  // ─── Recalculate handle positions after node changes ───────────────────────
  // ReactFlow caches handle positions on mount. New nodes need time for their
  // Handle components to register before we can re-read positions.
  const updateNodeInternals = useUpdateNodeInternals();
  const prevNodeCountRef = useRef(0);
  useEffect(() => {
    if (nodes.length === 0) return;
    // Only recalculate when node count actually changes (add/remove)
    if (nodes.length === prevNodeCountRef.current) return;
    prevNodeCountRef.current = nodes.length;
    // Delay to let ReactFlow finish internal handle registration for new nodes
    const timer = setTimeout(() => {
      for (const n of nodes) {
        updateNodeInternals(n.id);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [nodes, updateNodeInternals]);

  // ─── Drag start/stop: capture positions for undo ───────────────────────────
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const onNodeDragStart: OnNodeDrag = useCallback(
    (_event, _node, allNodes) => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const n of allNodes) {
        positions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
      }
      dragStartPositionsRef.current = positions;
    },
    []
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node, allNodes) => {
      const oldPositions = dragStartPositionsRef.current;
      const ls = layoutStateRef.current;
      const updatedPositions = { ...ls.positions };
      for (const n of allNodes) {
        updatedPositions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
      }
      const newState = { ...ls, positions: updatedPositions };
      setLayoutState(newState);
      persistLayout(newState);

      // Check if positions actually changed
      const moved = allNodes.some(n => {
        const old = oldPositions[n.id];
        return !old || Math.round(n.position.x) !== old.x || Math.round(n.position.y) !== old.y;
      });

      if (moved) {
        const dragLabel = allNodes.length === 1 ? `Moved ${getNodeDisplayName(node)}` : "Moved nodes";
        pushUndo({
          label: dragLabel,
          undo: () => {
            const cur = layoutStateRef.current;
            const undoState = { ...cur, positions: { ...cur.positions, ...oldPositions } };
            setLayoutState(undoState);
            persistLayout(undoState);
            setNodes((nds) =>
              nds.map((n) => oldPositions[n.id]
                ? { ...n, position: oldPositions[n.id] }
                : n
              )
            );
          },
          redo: () => {
            const cur = layoutStateRef.current;
            const redoState = { ...cur, positions: { ...cur.positions, ...updatedPositions } };
            setLayoutState(redoState);
            persistLayout(redoState);
            setNodes((nds) =>
              nds.map((n) => updatedPositions[n.id]
                ? { ...n, position: updatedPositions[n.id] }
                : n
              )
            );
          },
        });
      }
    },
    [persistLayout, pushUndo, setNodes]
  );

  // Restrict which handles can connect to which node types.
  // Each agent can only connect to its OWN tools/knowledge — no cross-agent.
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceHandle = connection.sourceHandle;
      const targetId = connection.target;
      const sourceId = connection.source;
      if (!targetId || !sourceId) return false;

      const targetNode = nodes.find((n) => n.id === targetId);
      if (!targetNode) return false;

      // Knowledge handle (bottom-left) → only parent agent can manually draw
      // Subagent knowledge edges are auto-generated in useCanvasLayout
      if (sourceHandle === "bottom-left") {
        if (targetNode.type !== "knowledgeNode") return false;
        return sourceId === "agent" && targetId === "knowledge";
      }

      // Tools handle (bottom-right) → tool or subagent nodes
      if (sourceHandle === "bottom-right") {
        if (targetNode.type === "toolNode") {
          // Only parent agent can manually draw edges to tools.
          // Subagent tools are added via the "+" button on SubagentNode.
          return sourceId === "agent" && !targetId.startsWith("tool-temp");
        }

        // Subagent nodes can only be connected from the parent agent
        if (targetNode.type === "subagentNode") {
          return sourceId === "agent";
        }

        return false;
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
      // Optimistically update local state — parent tools
      setAgentTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, is_enabled: enabled } : t))
      );
      // Also update subagent tools so their nodes reflect the change immediately
      if (ownerAgentId !== agent.id) {
        setSubagentDetails((prev) =>
          prev.map((sa) =>
            sa.id === ownerAgentId
              ? { ...sa, tools: sa.tools.map((t) => (t.id === toolId ? { ...t, is_enabled: enabled } : t)) }
              : sa
          )
        );
      }
    },
    [agent.id]
  );

  // Helper: auto-create edge for a tool and enable it (used by undo/redo closures)
  const autoConnectTool = useCallback(
    (ownerAgentId: string, toolId: string, toolType: string, config?: Record<string, unknown>) => {
      const isSubagentTool = ownerAgentId !== agent.id;
      const nodeId = toolType === "subagent"
        ? `subagent-${(config as { target_agent_id?: string })?.target_agent_id}`
        : isSubagentTool
          ? `sa-${ownerAgentId}-tool-${toolId}`
          : `tool-${toolId}`;
      const sourceNode = isSubagentTool ? `subagent-${ownerAgentId}` : "agent";
      const edgeId = `e-${sourceNode}-${nodeId}`;

      setEdges((prev) => {
        if (prev.some(e => e.id === edgeId)) return prev;
        const updated = addEdge(
          { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: nodeId, type: "dashedEdge" },
          prev
        );
        const ls = layoutStateRef.current;
        const newState = { ...ls, edges: updated.filter(e => !e.id.endsWith("-knowledge")) };
        setLayoutState(newState);
        persistLayout(newState);
        return updated;
      });
      setToolEnabled(ownerAgentId, toolId, true);
    },
    [agent.id, setEdges, persistLayout, setToolEnabled]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (!source || !target) return;

      const newEdge: Edge = {
        ...params,
        id: `e-${source}-${target}`,
        type: "dashedEdge",
      };

      // Add edge + persist
      setEdges((currentEdges) => {
        const updated = addEdge(newEdge, currentEdges);
        const ls = layoutStateRef.current;
        const newState = { ...ls, edges: updated.filter(e => !e.id.endsWith("-knowledge")) };
        setLayoutState(newState);
        persistLayout(newState);
        return updated;
      });

      // Enable the tool in DB
      const resolved = resolveToolFromNodeId(target);
      if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, true);

      // Undo support
      const targetNode = nodes.find(n => n.id === target);
      const displayName = targetNode ? getNodeDisplayName(targetNode) : target;

      pushUndo({
        label: `Connected ${displayName}`,
        undo: () => {
          isUndoingRef.current = true;
          setEdges((prev) => {
            const filtered = prev.filter((e) => e.id !== newEdge.id);
            const s = { ...layoutStateRef.current, edges: filtered.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return filtered;
          });
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
        redo: () => {
          isUndoingRef.current = true;
          setEdges((prev) => {
            const restored = addEdge(newEdge, prev);
            const s = { ...layoutStateRef.current, edges: restored.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return restored;
          });
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, true);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
      });
    },
    [nodes, persistLayout, setEdges, resolveToolFromNodeId, setToolEnabled, pushUndo]
  );

  // Wrapper for onEdgesChange — handles keyboard delete, persist, undo, toast
  const handleEdgesChange = useCallback(
    (changes: any) => {
      if (isUndoingRef.current) { onEdgesChange(changes); return; }

      // Capture removed edges before applying (skip auto-generated knowledge edges)
      const removedEdges: Edge[] = [];
      const currentEdges = edgesRef.current;
      for (const change of changes) {
        if (change.type === "remove") {
          const found = currentEdges.find((e: Edge) => e.id === change.id);
          if (found && !found.id.endsWith("-knowledge")) removedEdges.push(found);
        }
      }

      onEdgesChange(changes);

      if (removedEdges.length === 0) return;

      // Disable tools whose edges were removed
      for (const edge of removedEdges) {
        if (edge.target) {
          const resolved = resolveToolFromNodeId(edge.target);
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);
        }
      }

      // Persist layout with latest edges via functional updater
      setEdges((currentEdges) => {
        const ls = layoutStateRef.current;
        const newState = { ...ls, edges: currentEdges.filter(e => !e.id.endsWith("-knowledge")) };
        setLayoutState(newState);
        persistLayout(newState);
        return currentEdges;
      });

      // Display names for toast/undo
      const names = removedEdges.map(e => {
        const n = nodes.find(nd => nd.id === e.target);
        return n ? getNodeDisplayName(n) : "connection";
      });

      const toastMsg = removedEdges.length === 1
        ? `${names[0]} disconnected`
        : `${removedEdges.length} connections removed`;
      showUndoToast(toastMsg);

      pushUndo({
        label: removedEdges.length === 1 ? `Disconnected ${names[0]}` : `Disconnected ${removedEdges.length} edges`,
        undo: () => {
          isUndoingRef.current = true;
          setEdges((prev) => {
            let restored = [...prev];
            for (const edge of removedEdges) {
              restored = addEdge(edge, restored);
              if (edge.target) {
                const r = resolveToolFromNodeId(edge.target);
                if (r) setToolEnabled(r.agentId, r.toolId, true);
              }
            }
            const s = { ...layoutStateRef.current, edges: restored.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return restored;
          });
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
        redo: () => {
          isUndoingRef.current = true;
          const removedIds = new Set(removedEdges.map(e => e.id));
          setEdges((prev) => {
            const filtered = prev.filter(e => !removedIds.has(e.id));
            for (const edge of removedEdges) {
              if (edge.target) {
                const r = resolveToolFromNodeId(edge.target);
                if (r) setToolEnabled(r.agentId, r.toolId, false);
              }
            }
            const s = { ...layoutStateRef.current, edges: filtered.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return filtered;
          });
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
      });
    },
    [onEdgesChange, persistLayout, setEdges, resolveToolFromNodeId, setToolEnabled, pushUndo, showUndoToast]
  );

  // ─── Edge deletion via DashedEdge X button ──────────────────────────────
  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      const edge = edgesRef.current.find(e => e.id === edgeId);
      if (!edge || !edge.target) return;
      if (edge.id.endsWith("-knowledge")) return;

      const targetNode = nodes.find(n => n.id === edge.target);
      const displayName = targetNode ? getNodeDisplayName(targetNode) : "connection";
      const resolved = resolveToolFromNodeId(edge.target);

      // Remove edge, disable tool, persist — all in one functional updater
      setEdges((currentEdges) => {
        const filtered = currentEdges.filter(e => e.id !== edgeId);
        const ls = layoutStateRef.current;
        const newState = { ...ls, edges: filtered.filter(e => !e.id.endsWith("-knowledge")) };
        setLayoutState(newState);
        persistLayout(newState);
        return filtered;
      });

      if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);

      showUndoToast(`${displayName} disconnected`);

      pushUndo({
        label: `Disconnected ${displayName}`,
        undo: () => {
          isUndoingRef.current = true;
          setEdges((prev) => {
            const restored = addEdge(edge, prev);
            const s = { ...layoutStateRef.current, edges: restored.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return restored;
          });
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, true);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
        redo: () => {
          isUndoingRef.current = true;
          setEdges((prev) => {
            const filtered = prev.filter(e => e.id !== edgeId);
            const s = { ...layoutStateRef.current, edges: filtered.filter(e => !e.id.endsWith("-knowledge")) };
            setLayoutState(s);
            persistLayout(s);
            return filtered;
          });
          if (resolved) setToolEnabled(resolved.agentId, resolved.toolId, false);
          requestAnimationFrame(() => { isUndoingRef.current = false; });
        },
      });
    },
    [nodes, resolveToolFromNodeId, setToolEnabled, setEdges, persistLayout, pushUndo, showUndoToast]
  );

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
  // Subagent left-panel mode: when set, LeftCatalogPanel shows click-to-add UI
  const [catalogTargetAgent, setCatalogTargetAgent] = useState<{ id: string; name: string; hasKnowledge?: boolean } | null>(null);
  // Preserve agentId across modal transitions (catalog → app library → composio setup)
  const pendingComposioAgentRef = useRef<string | null>(null);
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
    const ownerAgentId = setupTool?.agentId ?? composioSetup?.agentId ?? agent.id;
    const isSubagentTool = ownerAgentId !== agent.id;

    // Snapshot tool IDs BEFORE fetch (from closure — these are the pre-save values)
    const prevToolIds = new Set(
      isSubagentTool
        ? (subagentDetails.find((s) => s.id === ownerAgentId)?.tools ?? []).map((t) => t.id)
        : agentTools.map((t) => t.id)
    );
    const editSnapshot = editingToolSnapshotRef.current;
    editingToolSnapshotRef.current = null;

    setSetupTool(null);
    setCatalogContext(null);
    setComposioSetup(null);
    setAppLibraryOpen(false);

    // Fetch returns FRESH data — don't rely on stale closure values
    const [freshTools, freshSubagents] = await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();

    // Find new tools by comparing fresh data against pre-save snapshot
    const ownerTools = isSubagentTool
      ? (freshSubagents.find((s) => s.id === ownerAgentId)?.tools ?? [])
      : freshTools;
    const newTools = ownerTools.filter((t) => !prevToolIds.has(t.id));

    // Handle tool config edit undo (no new tools → must be an edit)
    if (editSnapshot && newTools.length === 0) {
      const updatedTool = ownerTools.find((t) => t.id === editSnapshot.id);
      if (updatedTool) {
        const newSnapshot = { ...updatedTool };
        pushUndo({
          label: `Updated ${editSnapshot.display_name}`,
          undo: async () => {
            await fetch(`/api/agents/${ownerAgentId}/tools/${editSnapshot.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                display_name: editSnapshot.display_name,
                description: editSnapshot.description,
                config: editSnapshot.config,
                is_enabled: editSnapshot.is_enabled,
              }),
            });
            await Promise.all([fetchTools(), fetchSubagents()]);
          },
          redo: async () => {
            await fetch(`/api/agents/${ownerAgentId}/tools/${editSnapshot.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                display_name: newSnapshot.display_name,
                description: newSnapshot.description,
                config: newSnapshot.config,
                is_enabled: newSnapshot.is_enabled,
              }),
            });
            await Promise.all([fetchTools(), fetchSubagents()]);
          },
        });
      }
    }

    if (newTools.length > 0) {
      // Push undo for each new tool
      for (const tool of newTools) {
        let currentToolId = tool.id;
        pushUndo({
          label: `Added ${tool.display_name}`,
          undo: async () => {
            isUndoingRef.current = true;
            await fetch(`/api/agents/${ownerAgentId}/tools/${currentToolId}`, { method: "DELETE" });
            await Promise.all([fetchTools(), fetchSubagents()]);
            isUndoingRef.current = false;
          },
          redo: async () => {
            isUndoingRef.current = true;
            const res = await fetch(`/api/agents/${ownerAgentId}/tools`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool_type: tool.tool_type,
                display_name: tool.display_name,
                description: tool.description,
                config: tool.config,
                is_enabled: tool.is_enabled,
              }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.tool) {
                currentToolId = json.tool.id;
                await Promise.all([fetchTools(), fetchSubagents()]);
                autoConnectTool(ownerAgentId, json.tool.id, tool.tool_type, tool.config as Record<string, unknown>);
              } else {
                await Promise.all([fetchTools(), fetchSubagents()]);
              }
            } else {
              await Promise.all([fetchTools(), fetchSubagents()]);
            }
            isUndoingRef.current = false;
          },
        });
      }

      // Auto-create edges for new tools and enable them
      for (const tool of newTools) {
        const nodeId = tool.tool_type === "subagent"
          ? `subagent-${(tool.config as { target_agent_id?: string }).target_agent_id}`
          : isSubagentTool
            ? `sa-${ownerAgentId}-tool-${tool.id}`
            : `tool-${tool.id}`;
        const sourceNode = isSubagentTool ? `subagent-${ownerAgentId}` : "agent";
        const edgeId = `e-${sourceNode}-${nodeId}`;

        setEdges((prev) => {
          if (prev.some(e => e.id === edgeId)) return prev;
          const updated = addEdge(
            { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: nodeId, type: "dashedEdge" },
            prev
          );
          const ls = layoutStateRef.current;
          const newState = { ...ls, edges: updated.filter(e => !e.id.endsWith("-knowledge")) };
          setLayoutState(newState);
          persistLayout(newState);
          return updated;
        });
        setToolEnabled(ownerAgentId, tool.id, true);
      }
    }
  }, [agentTools, subagentDetails, agent.id, setupTool, composioSetup, fetchTools, fetchSubagents, notifySaved, setToolEnabled, pushUndo, setEdges, persistLayout, autoConnectTool]);

  const handleToolDeleted = useCallback(async () => {
    setSetupTool(null);
    setComposioSetup(null);
    await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();
    // Tool deletion invalidates prior undo history (old entries reference
    // the deleted tool's node/edges and produce phantom undos).
    clearUndo();
  }, [fetchTools, fetchSubagents, notifySaved, clearUndo]);

  const handleSubagentDeleted = useCallback(async () => {
    setModal({ type: "none" });
    await Promise.all([fetchTools(), fetchSubagents()]);
    notifySaved();
    clearUndo();
  }, [fetchTools, fetchSubagents, notifySaved, clearUndo]);

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
      editingToolSnapshotRef.current = { ...existing };
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

      // Tools dropped on canvas always belong to the parent agent.
      // Subagent tools are added via the "+" button on SubagentNode.
      const targetAgentId = agent.id;

      if (type === "knowledge") {
        // Only allow one knowledge base per agent
        if (hasKnowledge) return;

        // Optimistic: add knowledge node + edge immediately (same pattern as tool nodes)
        setNodes((prev) => [
          ...prev,
          {
            id: "knowledge",
            type: "knowledgeNode",
            position,
            data: {
              agentId: agent.id,
              documentCount: 0,
              readyCount: 0,
              processingCount: 0,
            } as unknown as Record<string, unknown>,
            draggable: true,
          },
        ]);
        setEdges((prev) => {
          if (prev.some((e) => e.id === "agent-knowledge")) return prev;
          return addEdge(
            { id: "agent-knowledge", source: "agent", sourceHandle: "bottom-left", target: "knowledge", type: "dashedEdge" },
            prev
          );
        });
        setHasKnowledge(true);

        // Save position
        const ls = layoutStateRef.current;
        const newPos = { ...ls.positions, knowledge: position };
        const newState = { ...ls, positions: newPos };
        setLayoutState(newState);
        persistLayout(newState);

        // PATCH async (with rollback on failure)
        void (async () => {
          const res = await fetch(`/api/agents/${targetAgentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ knowledge_enabled: true, skip_version: true }),
          });
          if (!res.ok) {
            setNodes((prev) => prev.filter((n) => n.id !== "knowledge"));
            setEdges((prev) => prev.filter((e) => e.id !== "agent-knowledge"));
            setHasKnowledge(false);
            toast.error("Failed to enable knowledge base");
            return;
          }
          pushUndo({
            label: "Enabled knowledge base",
            undo: async () => {
              await fetch(`/api/agents/${targetAgentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: false, skip_version: true }),
              });
              setHasKnowledge(false);
            },
            redo: async () => {
              await fetch(`/api/agents/${targetAgentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: true, skip_version: true }),
              });
              setHasKnowledge(true);
            },
          });
        })();
      } else if (type === "composio") {
        // Optimistic: show placeholder node instantly
        const tempId = `temp-${Date.now()}`;
        const tempNodeId = targetAgentId === agent.id ? `tool-${tempId}` : `sa-${targetAgentId}-tool-${tempId}`;
        const needsAuth = toolkit ? (composioConnectionsLoading ? false : !isComposioConnected(toolkit)) : false;
        setNodes((prev) => [
          ...prev,
          {
            id: tempNodeId,
            type: "toolNode",
            position,
            data: {
              toolId: tempId, agentId: targetAgentId,
              toolType: "composio" as ToolType, displayName: name,
              isEnabled: false, toolkitIcon: icon, toolkitSlug: toolkit,
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
              is_enabled: false,
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

            // Sub-agent: auto-create edge from subagent to tool and enable it
            if (targetAgentId !== agent.id) {
              const sourceNode = `subagent-${targetAgentId}`;
              const edgeId = `e-${sourceNode}-${realNodeId}`;
              setEdges((prev) => {
                if (prev.some((e) => e.id === edgeId)) return prev;
                const updated = addEdge(
                  { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: realNodeId, type: "dashedEdge" },
                  prev
                );
                const ls = layoutStateRef.current;
                const newEdgeState = { ...ls, edges: updated.filter((e) => !e.id.endsWith("-knowledge")) };
                setLayoutState(newEdgeState);
                persistLayout(newEdgeState);
                return updated;
              });
              setToolEnabled(targetAgentId, json.tool.id, true);
            }

            let currentToolId = json.tool.id as string;
            pushUndo({
              label: `Added ${name}`,
              undo: async () => {
                isUndoingRef.current = true;
                await fetch(`/api/agents/${targetAgentId}/tools/${currentToolId}`, { method: "DELETE" });
                await fetchTools();
                isUndoingRef.current = false;
              },
              redo: async () => {
                isUndoingRef.current = true;
                const r = await fetch(`/api/agents/${targetAgentId}/tools`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tool_type: "composio",
                    display_name: name,
                    description: `Use ${name} actions.`,
                    config: { toolkit, toolkit_name: name, toolkit_icon: icon },
                    is_enabled: false,
                  }),
                });
                if (r.ok) {
                  const j = await r.json();
                  if (j.tool) {
                    currentToolId = j.tool.id;
                    await fetchTools();
                    autoConnectTool(targetAgentId, j.tool.id, "composio", { toolkit, toolkit_name: name, toolkit_icon: icon });
                  } else { await fetchTools(); }
                } else { await fetchTools(); }
                isUndoingRef.current = false;
              },
            });
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
              toolType: type as ToolType, displayName: defaultName, isEnabled: false,
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
              is_enabled: false,
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

            // Sub-agent: auto-create edge from subagent to tool and enable it
            if (targetAgentId !== agent.id) {
              const sourceNode = `subagent-${targetAgentId}`;
              const edgeId = `e-${sourceNode}-${realNodeId}`;
              setEdges((prev) => {
                if (prev.some((e) => e.id === edgeId)) return prev;
                const updated = addEdge(
                  { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: realNodeId, type: "dashedEdge" },
                  prev
                );
                const ls = layoutStateRef.current;
                const newEdgeState = { ...ls, edges: updated.filter((e) => !e.id.endsWith("-knowledge")) };
                setLayoutState(newEdgeState);
                persistLayout(newEdgeState);
                return updated;
              });
              setToolEnabled(targetAgentId, json.tool.id, true);
            }

            let currentToolId = json.tool.id as string;
            const toolType = type;
            pushUndo({
              label: `Added ${defaultName}`,
              undo: async () => {
                isUndoingRef.current = true;
                await fetch(`/api/agents/${targetAgentId}/tools/${currentToolId}`, { method: "DELETE" });
                await fetchTools();
                isUndoingRef.current = false;
              },
              redo: async () => {
                isUndoingRef.current = true;
                const r = await fetch(`/api/agents/${targetAgentId}/tools`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tool_type: toolType,
                    display_name: defaultName,
                    description: "",
                    config: {},
                    is_enabled: false,
                  }),
                });
                if (r.ok) {
                  const j = await r.json();
                  if (j.tool) {
                    currentToolId = j.tool.id;
                    await fetchTools();
                    autoConnectTool(targetAgentId, j.tool.id, toolType, {});
                  } else { await fetchTools(); }
                } else { await fetchTools(); }
                isUndoingRef.current = false;
              },
            });
          }
          await fetchTools();
          if (targetAgentId !== agent.id) await fetchSubagents();
        })();
      }

    } catch (e) {
      console.error("Drop failed", e);
    }
  }, [agent.id, getNodes, screenToFlowPosition, layoutState, persistLayout, fetchTools, fetchSubagents, isComposioConnected, pushUndo, setEdges, setToolEnabled, hasKnowledge, autoConnectTool]);

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
        subagentCount={canvasSummary.subagentCount}
        toolCount={canvasSummary.toolCount}
        onTest={handleToggleTest}
        isTestOpen={chatOpen}
        saveStatus={saveStatus}
        onBack={handleBack}
      />

      <LeftCatalogPanel
        targetAgent={catalogTargetAgent}
        onClearTarget={() => setCatalogTargetAgent(null)}
        parentHasKnowledge={hasKnowledge}
        onToolClick={(type, payload) => {
          const tgt = catalogTargetAgent;
          if (!tgt) return;

          if (type === "knowledge") {
            const saId = `subagent-${tgt.id}`;
            const kbId = `sa-${tgt.id}-knowledge`;
            const edgeId = `${saId}-knowledge`;
            const saNode = getNodes().find((n) => n.id === saId);
            const saPos = saNode?.position ?? { x: 0, y: 0 };
            // Position under subagent's left handle (25% of 280px width) minus half knowledge width (96/2)
            const kbX = saPos.x + 280 * 0.25 - 96 / 2;
            const kbY = saPos.y + 260;

            // Optimistic: add knowledge node + edge immediately
            // NOTE: Do NOT call setLayoutState here — it would change layoutState,
            // causing useCanvasLayout to recompute layoutNodes WITHOUT the subagent
            // knowledge node (since subagentDetails hasn't updated yet), which would
            // trigger the merge useEffect to mark this optimistic node as _exiting.
            // Position is persisted after fetchSubagents() completes instead.
            setNodes((prev) => [
              ...prev,
              {
                id: kbId,
                type: "knowledgeNode",
                position: { x: kbX, y: kbY },
                data: {
                  agentId: tgt.id,
                  documentCount: 0,
                  readyCount: 0,
                  processingCount: 0,
                } as unknown as Record<string, unknown>,
                draggable: true,
              },
            ]);
            setEdges((prev) => {
              if (prev.some((e) => e.id === edgeId)) return prev;
              return addEdge(
                { id: edgeId, source: saId, sourceHandle: "bottom-left", target: kbId, type: "dashedEdge" },
                prev
              );
            });

            // PATCH async (with rollback on failure)
            void (async () => {
              const res = await fetch(`/api/agents/${tgt.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_enabled: true, skip_version: true }),
              });
              if (!res.ok) {
                setNodes((prev) => prev.filter((n) => n.id !== kbId));
                setEdges((prev) => prev.filter((e) => e.id !== edgeId));
                toast.error("Failed to enable knowledge base");
                return;
              }
              await fetchSubagents();
              // Persist position AFTER fetchSubagents so layoutNodes includes the knowledge node
              const ls = layoutStateRef.current;
              const newPos = { ...ls.positions, [kbId]: { x: kbX, y: kbY } };
              const newState = { ...ls, positions: newPos };
              setLayoutState(newState);
              persistLayout(newState);
              setCatalogTargetAgent(null);
              setModal({ type: "subagent-knowledge", agentId: tgt.id });
            })();
          } else if (type === "composio" && payload) {
            // Create tool directly — same as parent drag-and-drop flow
            const { toolkit, name, icon } = payload as { toolkit: string; name: string; icon: string };
            void (async () => {
              const res = await fetch(`/api/agents/${tgt.id}/tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tool_type: "composio",
                  display_name: name,
                  description: `Use ${name} actions.`,
                  config: { toolkit, toolkit_name: name, toolkit_icon: icon },
                  is_enabled: false,
                }),
              });
              if (!res.ok) { toast.error("Failed to create tool"); return; }
              // Refetch — handleToolSaved-style auto-edge creation
              await Promise.all([fetchTools(), fetchSubagents()]);
              notifySaved();
              // Auto-create edge for the new tool
              const json = await res.json();
              if (json.tool) {
                const nodeId = `sa-${tgt.id}-tool-${json.tool.id}`;
                const sourceNode = `subagent-${tgt.id}`;
                const edgeId = `e-${sourceNode}-${nodeId}`;
                setEdges((prev) => {
                  if (prev.some(e => e.id === edgeId)) return prev;
                  const updated = addEdge(
                    { id: edgeId, source: sourceNode, sourceHandle: "bottom-right", target: nodeId, type: "dashedEdge" },
                    prev
                  );
                  const ls = layoutStateRef.current;
                  const ns = { ...ls, edges: updated.filter(e => !e.id.endsWith("-knowledge")) };
                  setLayoutState(ns); persistLayout(ns);
                  return updated;
                });
                setToolEnabled(tgt.id, json.tool.id, true);
              }
            })();
          } else {
            // webhook, http, mcp → open setup dialog for the subagent
            setCatalogTargetAgent(null);
            setSetupTool({ toolType: type, agentId: tgt.id });
          }
        }}
      />

      {toolsReady ? (
        <CanvasActionsContext.Provider
          value={{
            openCatalogForAgent: (saId: string) => {
              const sa = subagentNodeItems.find((s) => s.subagentId === saId);
              setCatalogTargetAgent({ id: saId, name: sa?.name ?? "Sub-Agent", hasKnowledge: sa?.hasKnowledge ?? false });
            },
            onDeleteEdge,
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeDragStart={onNodeDragStart}
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

      {/* Undo/Redo inline status pill */}
      {undoToast && (
        <div
          className={`absolute bottom-[68px] left-6 md:left-[320px] z-30 transition-opacity duration-300 ${undoToastFading ? "opacity-0" : "opacity-100 animate-in fade-in slide-in-from-bottom-2 duration-200"}`}
        >
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/80 canvas-dark:bg-neutral-800/80 backdrop-blur-md border border-white/60 canvas-dark:border-neutral-700/40 text-neutral-700 canvas-dark:text-neutral-300 shadow-sm">
            {undoToast}
          </div>
        </div>
      )}

      {/* Undo/Redo + Zoom controls */}
      <div className="absolute bottom-6 left-6 md:left-[320px] z-30 flex items-center gap-1 bg-white/70 canvas-dark:bg-[#1C1C1C]/70 backdrop-blur-xl border border-white/60 canvas-dark:border-[#2A2A2A]/50 shadow-sm rounded-xl p-1.5">
        <button
          onClick={() => { if (canUndo) { const l = undoLabel; void undo().then(ok => showUndoToast(ok ? `Undone: ${l}` : `Undo failed: ${l}`)); } }}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={canUndo ? `Undo: ${undoLabel}` : "Nothing to undo"}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { if (canRedo) { const l = redoLabel; void redo().then(ok => showUndoToast(ok ? `Redone: ${l}` : `Redo failed: ${l}`)); } }}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={canRedo ? `Redo: ${redoLabel}` : "Nothing to redo"}
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-neutral-200 canvas-dark:bg-[#2A2A2A] mx-0.5" />
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

      <AnimatePresence>
        {modal.type !== "none" && (
          <NodeModal
            key="node-modal"
            onClose={handleCloseModal}
            title={modalTitle}
          >
            {modal.type === "edit-agent" && (
              <AgentEditPanel
                agentId={agent.id}
                formState={formState}
                setFormState={setFormState}
                tools={agentTools}
                onToolsChanged={() => void fetchTools()}
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <FloatingChatWidget
            key="chat-widget"
            agentId={agent.id}
            agentName={agent.name}
            greetingMessage={personality?.greeting_message}
            voiceConfig={formState.voiceConfig}
            onVoiceConfigUpdate={(config) => setFormState((prev) => ({ ...prev, voiceConfig: config }))}
            agentModel={formState.model}
            onModelChange={(model) => setFormState((prev) => ({ ...prev, model }))}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>

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
          // Preserve agentId for the composio flow before clearing catalog
          pendingComposioAgentRef.current = catalogContext?.agentId ?? agent.id;
          setCatalogContext(null);
          setAppLibraryOpen(true);
        }}
      />

      <AppLibraryModal
        open={appLibraryOpen}
        onClose={() => { setAppLibraryOpen(false); pendingComposioAgentRef.current = null; }}
        onSelectApp={(app, connection) => {
          setAppLibraryOpen(false);
          setComposioSetup({
            agentId: pendingComposioAgentRef.current ?? agent.id,
            toolkit: app.toolkit,
            toolkitName: app.name,
            toolkitIcon: app.icon,
            connectionId: connection.id,
          });
        }}
      />

      <AnimatePresence>
        {setupTool?.toolType === "http" && (
          <HttpToolSetup
            key="http-setup"
            agentId={setupTool.agentId}
            existing={setupTool.existing}
            onSaved={handleToolSaved}
            onClose={() => setSetupTool(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {setupTool?.toolType === "subagent" && (
          <SubagentSetup
            key="subagent-setup"
            agentId={setupTool.agentId}
            existing={setupTool.existing}
            onSaved={handleToolSaved}
            onClose={() => setSetupTool(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {setupTool &&
          setupTool.toolType !== "http" &&
          setupTool.toolType !== "subagent" && (
            <ToolSetupDialog
              key="tool-setup"
              agentId={setupTool.agentId}
              toolType={setupTool.toolType}
              existing={setupTool.existing}
              onSaved={handleToolSaved}
              onDeleted={handleToolDeleted}
              onClose={() => setSetupTool(null)}
            />
          )}
      </AnimatePresence>

      <AnimatePresence>
        {composioSetup && (
          <ComposioToolSetup
            key="composio-setup"
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
      </AnimatePresence>

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
