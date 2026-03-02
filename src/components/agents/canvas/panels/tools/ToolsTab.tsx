"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCatalogModal } from "./ToolCatalogModal";
import { ToolSetupDialog } from "./ToolSetupDialog";
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
    void fetchTools();
  };

  const handleSelectFromCatalog = (toolType: string) => {
    setCatalogOpen(false);
    setSetupTool({ toolType });
  };

  const handleEditTool = (tool: AgentToolResponse) => {
    setSetupTool({ toolType: tool.tool_type, existing: tool });
  };

  const handleDeleteTool = async (toolId: string) => {
    await fetch(`/api/agents/${agentId}/tools/${toolId}`, { method: "DELETE" });
    const updated = tools.filter((t) => t.id !== toolId);
    setTools(updated);
    const enabled = updated.filter((t) => t.is_enabled);
    onToolCountChange?.(enabled.length, enabled.map((t) => t.display_name));
  };

  const handleToggleTool = async (toolId: string, isEnabled: boolean) => {
    const updated = tools.map((t) =>
      t.id === toolId ? { ...t, is_enabled: isEnabled } : t
    );
    setTools(updated);
    const enabledTools = updated.filter((t) => t.is_enabled);
    onToolCountChange?.(enabledTools.length, enabledTools.map((t) => t.display_name));
    await fetch(`/api/agents/${agentId}/tools/${toolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: isEnabled }),
    });
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
      />

      {/* Setup dialog */}
      {setupTool && (
        <ToolSetupDialog
          agentId={agentId}
          toolType={setupTool.toolType}
          existing={setupTool.existing}
          onSaved={handleToolSaved}
          onClose={() => setSetupTool(null)}
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
          Add tools so your agent can book appointments, create CRM contacts, and more
        </p>
      </div>
    </button>
  );
}
