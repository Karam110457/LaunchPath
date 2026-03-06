"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCatalogModal } from "./ToolCatalogModal";
import { ToolSetupDialog } from "./ToolSetupDialog";
import { HttpToolSetup } from "./HttpToolSetup";
import { SubagentSetup } from "./SubagentSetup";
import { AppLibraryModal } from "./AppLibraryModal";
import { ComposioToolSetup } from "./ComposioToolSetup";
import { EnabledToolsList } from "./EnabledToolsList";
import type { AgentToolResponse } from "@/lib/tools/types";

interface ToolsTabProps {
  agentId: string;
  onToolCountChange?: (count: number, names: string[]) => void;
}

export function ToolsTab({ agentId, onToolCountChange }: ToolsTabProps) {
  const [tools, setTools] = useState<AgentToolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [setupTool, setSetupTool] = useState<{
    toolType: string;
    existing?: AgentToolResponse;
  } | null>(null);
  const [appLibraryOpen, setAppLibraryOpen] = useState(false);
  const [composioSetup, setComposioSetup] = useState<{
    toolkit: string;
    toolkitName: string;
    toolkitIcon: string;
    connectionId: string;
    existing?: AgentToolResponse;
  } | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/tools`);
      if (res.ok) {
        const data = (await res.json()) as { tools: AgentToolResponse[] };
        setTools(data.tools);
        const enabled = data.tools.filter((t) => t.is_enabled);
        onToolCountChange?.(enabled.length, enabled.map((t) => t.display_name));
      }
    } finally {
      setLoading(false);
    }
  }, [agentId, onToolCountChange]);

  useEffect(() => {
    void fetchTools();
  }, [fetchTools]);

  const handleToolSaved = () => {
    setSetupTool(null);
    setCatalogOpen(false);
    setComposioSetup(null);
    setAppLibraryOpen(false);
    void fetchTools();
  };

  const handleSelectFromCatalog = (toolType: string) => {
    setCatalogOpen(false);
    setSetupTool({ toolType });
  };

  const handleEditTool = (tool: AgentToolResponse) => {
    if (tool.tool_type === "composio") {
      const cfg = tool.config as {
        toolkit?: string;
        toolkit_name?: string;
        toolkit_icon?: string;
        connection_id?: string;
      };
      setComposioSetup({
        toolkit: cfg.toolkit ?? "",
        toolkitName: cfg.toolkit_name ?? tool.display_name,
        toolkitIcon: cfg.toolkit_icon ?? tool.display_name.charAt(0),
        connectionId: cfg.connection_id ?? "",
        existing: tool,
      });
    } else if (tool.tool_type === "http" || tool.tool_type === "subagent") {
      // HTTP and subagent use custom setup dialogs — route via setupTool
      setSetupTool({ toolType: tool.tool_type, existing: tool });
    } else {
      setSetupTool({ toolType: tool.tool_type, existing: tool });
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    await fetch(`/api/agents/${agentId}/tools/${toolId}`, { method: "DELETE" });
    const updated = tools.filter((t) => t.id !== toolId);
    setTools(updated);
    const enabled = updated.filter((t) => t.is_enabled);
    onToolCountChange?.(enabled.length, enabled.map((t) => t.display_name));
  };

  const handleToggleTool = async (toolId: string, isEnabled: boolean) => {
    // Optimistic update — roll back if the API call fails
    const previous = tools;
    const updated = tools.map((t) =>
      t.id === toolId ? { ...t, is_enabled: isEnabled } : t
    );
    setTools(updated);
    const enabledUpdated = updated.filter((t) => t.is_enabled);
    onToolCountChange?.(enabledUpdated.length, enabledUpdated.map((t) => t.display_name));

    try {
      const res = await fetch(`/api/agents/${agentId}/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: isEnabled }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert to previous state on failure
      setTools(previous);
      const enabledPrevious = previous.filter((t) => t.is_enabled);
      onToolCountChange?.(enabledPrevious.length, enabledPrevious.map((t) => t.display_name));
    }
  };

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tools
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actions your agent can take during conversations
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCatalogOpen(true)}
          className="gap-1.5 text-xs h-7"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tool
        </Button>
      </div>

      {/* Tool list or empty state */}
      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <ToolsEmptyState onAdd={() => setCatalogOpen(true)} />
      ) : (
        <EnabledToolsList
          tools={tools}
          onEdit={handleEditTool}
          onDelete={handleDeleteTool}
          onToggle={handleToggleTool}
        />
      )}

      {/* Catalog picker */}
      <ToolCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelect={handleSelectFromCatalog}
        existingTypes={tools.map((t) => t.tool_type)}
        onAppLibrary={() => {
          setCatalogOpen(false);
          setAppLibraryOpen(true);
        }}
      />

      {/* App Library (Composio) */}
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

      {/* Setup dialog — route to the right component based on tool type */}
      {setupTool?.toolType === "http" && (
        <HttpToolSetup
          agentId={agentId}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool?.toolType === "subagent" && (
        <SubagentSetup
          agentId={agentId}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
        />
      )}
      {setupTool &&
        setupTool.toolType !== "http" &&
        setupTool.toolType !== "subagent" && (
          <ToolSetupDialog
            agentId={agentId}
            toolType={setupTool.toolType}
            existing={setupTool.existing}
            onSaved={handleToolSaved}
            onClose={() => setSetupTool(null)}
          />
        )}

      {/* Setup dialog (Composio tools) */}
      {composioSetup && (
        <ComposioToolSetup
          agentId={agentId}
          toolkit={composioSetup.toolkit}
          toolkitName={composioSetup.toolkitName}
          toolkitIcon={composioSetup.toolkitIcon}
          connectionId={composioSetup.connectionId}
          existing={composioSetup.existing}
          onSaved={handleToolSaved}
          onClose={() => setComposioSetup(null)}
        />
      )}
    </div>
  );
}

function ToolsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full rounded-xl border border-dashed border-border/60 p-6 flex flex-col items-center gap-3 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Wrench className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No tools yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect apps so your agent can send emails, manage calendars, and more
        </p>
      </div>
    </button>
  );
}
