"use client";

import {
  Webhook,
  Plug,
  Globe,
  Users,
  Library,
  Database,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/lib/tools/types";

const CUSTOM_TOOLS: {
  type: ToolType;
  name: string;
  tagline: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  {
    type: "webhook",
    name: "Webhook",
    tagline: "Send data to Zapier, Make, or any URL when the agent takes action.",
    Icon: Webhook,
    color: "text-emerald-400",
  },
  {
    type: "http",
    name: "HTTP Request",
    tagline: "Call any REST API and feed the response back to the agent.",
    Icon: Globe,
    color: "text-blue-400",
  },
  {
    type: "subagent",
    name: "Sub-Agent",
    tagline: "Delegate tasks to another agent — compose agents that work together.",
    Icon: Users,
    color: "text-amber-400",
  },
  {
    type: "mcp",
    name: "MCP Server",
    tagline: "Connect a Model Context Protocol server for custom tools.",
    Icon: Plug,
    color: "text-neutral-400",
  },
];

interface ToolCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toolType: string) => void;
  existingTypes: ToolType[];
  /** Whether knowledge base is already enabled for this agent */
  hasKnowledge?: boolean;
  /** Open the full app library */
  onAppLibrary?: () => void;
}

export function ToolCatalogModal({
  open,
  onClose,
  onSelect,
  existingTypes,
  hasKnowledge = false,
  onAppLibrary,
}: ToolCatalogModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Tool</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Give your agent new capabilities by connecting apps or custom tools.
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* App Library — primary action */}
          {onAppLibrary && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                App Library
              </p>
              <button
                type="button"
                onClick={onAppLibrary}
                className="w-full text-left rounded-xl border border-[#FF8C00]/25 bg-gradient-to-r from-[#FF8C00]/5 to-[#9D50BB]/5 hover:from-[#FF8C00]/10 hover:to-[#9D50BB]/10 hover:border-[#9D50BB]/40 p-4 flex items-center gap-3.5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl gradient-accent-bg flex items-center justify-center shrink-0">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    Browse 900+ Apps
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Gmail, Slack, Stripe, HubSpot, Notion, Google Calendar, and more.
                    Connect via OAuth in seconds.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#9D50BB] transition-colors shrink-0" />
              </button>
            </div>
          )}

          {/* Knowledge Base */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Capabilities
            </p>
            <button
              type="button"
              disabled={hasKnowledge}
              onClick={() => onSelect("knowledge")}
              className={cn(
                "w-full text-left rounded-xl border p-3.5 flex items-start gap-3.5 transition-all",
                hasKnowledge
                  ? "opacity-40 cursor-not-allowed border-border/50 bg-muted/20"
                  : "border-border/60 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer"
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Knowledge Base
                  </span>
                  {hasKnowledge && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      Added
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Upload documents, websites, and FAQs your agent can reference.
                </p>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border/40" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              Custom Tools
            </span>
            <div className="flex-1 border-t border-border/40" />
          </div>

          {/* Webhook + MCP */}
          <div className="space-y-2">
            {CUSTOM_TOOLS.map((tool) => {
              const alreadyAdded = existingTypes.includes(tool.type);

              return (
                <button
                  key={tool.type}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onSelect(tool.type)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 flex items-start gap-3.5 transition-all",
                    alreadyAdded
                      ? "opacity-40 cursor-not-allowed border-border/50 bg-muted/20"
                      : "border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <tool.Icon className={cn("w-4.5 h-4.5", tool.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {tool.name}
                      </span>
                      {alreadyAdded && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          Added
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {tool.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
