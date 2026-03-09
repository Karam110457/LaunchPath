"use client";

import { useState, useEffect } from "react";
import { Plug, Info, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { SuggestedTool } from "@/lib/agents/templates";

interface ToolkitLogo {
  toolkit: string;
  logo: string | null;
  name: string;
}

interface IntegrationsStepProps {
  suggestedTools: SuggestedTool[];
  selectedToolkits: string[];
  onSelectedToolkitsChange: (toolkits: string[]) => void;
}

export function IntegrationsStep({
  suggestedTools,
  selectedToolkits,
  onSelectedToolkitsChange,
}: IntegrationsStepProps) {
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const [loadingLogos, setLoadingLogos] = useState(false);

  // Fetch logos from Composio API on mount
  useEffect(() => {
    if (suggestedTools.length === 0) return;

    let cancelled = false;
    setLoadingLogos(true);

    fetch("/api/composio/apps")
      .then((res) => (res.ok ? res.json() : { apps: [] }))
      .then((data: { apps: ToolkitLogo[] }) => {
        if (cancelled) return;
        const map: Record<string, string | null> = {};
        for (const app of data.apps) {
          map[app.toolkit] = app.logo ?? null;
        }
        setLogos(map);
      })
      .catch(() => {
        // Non-critical — will show fallback icons
      })
      .finally(() => {
        if (!cancelled) setLoadingLogos(false);
      });

    return () => {
      cancelled = true;
    };
  }, [suggestedTools.length]);

  function toggleToolkit(toolkit: string) {
    if (selectedToolkits.includes(toolkit)) {
      onSelectedToolkitsChange(selectedToolkits.filter((t) => t !== toolkit));
    } else {
      onSelectedToolkitsChange([...selectedToolkits, toolkit]);
    }
  }

  const hasTools = suggestedTools.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasTools
            ? "Your agent works best with these integrations. Select the ones you want to use — you can connect them after creation."
            : "This agent type doesn't require any external integrations. It uses your knowledge base to answer questions."}
        </p>
      </div>

      {hasTools ? (
        <div className="space-y-3">
          <Label>Suggested integrations</Label>
          {loadingLogos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {suggestedTools.map((tool) => {
                const isSelected = selectedToolkits.includes(tool.toolkit);
                const logoUrl = logos[tool.toolkit];

                return (
                  <button
                    key={tool.toolkit}
                    type="button"
                    onClick={() => toggleToolkit(tool.toolkit)}
                    className={`
                      w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-all
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-primary/5"
                      }
                    `}
                  >
                    {/* Checkbox */}
                    <div
                      className={`
                        mt-0.5 w-4.5 h-4.5 shrink-0 rounded border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40"
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>

                    {/* Icon / Logo */}
                    <div
                      className={`
                        shrink-0 w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden
                        ${
                          isSelected
                            ? "bg-primary/10"
                            : "bg-muted"
                        }
                      `}
                    >
                      {logoUrl && logoUrl.startsWith("http") ? (
                        <img
                          src={logoUrl}
                          alt={tool.toolkitName}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.textContent = tool.toolkitName.charAt(0);
                              parent.classList.add("text-lg", "font-semibold", "text-muted-foreground");
                            }
                          }}
                        />
                      ) : (
                        <Plug
                          className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${isSelected ? "text-foreground" : ""}`}
                      >
                        {tool.toolkitName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tool.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tool.actions.map((action) => (
                          <span
                            key={action}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {formatActionName(action)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Plug className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No integrations needed for this agent type.
          </p>
          <p className="text-xs text-muted-foreground">
            You can always add tools later from the agent canvas.
          </p>
        </div>
      )}

      {/* Info note */}
      <div className="bg-muted/30 border rounded-lg p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {hasTools
            ? "You'll connect these integrations after your agent is created. Each integration requires a one-time authorization with your Google account."
            : "You can add integrations like Google Calendar, Gmail, or Google Sheets later from the agent's Tools tab."}
        </p>
      </div>
    </div>
  );
}

/** Turn "GOOGLECALENDAR_FIND_FREE_SLOTS" into "Find Free Slots" */
function formatActionName(action: string): string {
  const parts = action.split("_");
  // Skip the toolkit prefix (first part, e.g. "GOOGLECALENDAR")
  const rest = parts.slice(1);
  return rest
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
