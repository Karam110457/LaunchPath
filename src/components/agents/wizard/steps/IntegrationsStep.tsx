"use client";

import { useState, useEffect } from "react";
import { Plug, Info, Loader2 } from "lucide-react";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
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
      .catch(() => {})
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
      <WizardStepHeader
        title="Connect integrations"
        description={
          hasTools
            ? "Your agent works best with these integrations. Select the ones you want to use — you can connect them after creation."
            : "This agent type doesn't require any external integrations."
        }
      />

      {hasTools ? (
        <div className="space-y-3">
          {loadingLogos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedTools.map((tool) => {
                const isSelected = selectedToolkits.includes(tool.toolkit);
                const logoUrl = logos[tool.toolkit];

                return (
                  <button
                    key={tool.toolkit}
                    type="button"
                    onClick={() => toggleToolkit(tool.toolkit)}
                    className={`
                      w-full flex items-start gap-3 rounded-[20px] border p-5 text-left transition-all duration-200
                      ${
                        isSelected
                          ? "wizard-card-selected bg-white dark:bg-[#252525] shadow-[0_0_20px_-5px_rgba(157,80,187,0.15)]"
                          : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:bg-white dark:hover:bg-[#252525] hover:shadow-sm"
                      }
                    `}
                  >
                    {/* Checkbox */}
                    <div
                      className={`
                        mt-0.5 w-4.5 h-4.5 shrink-0 rounded border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? "bg-gradient-to-br from-[#FF8C00] to-[#9D50BB] border-transparent"
                            : "border-neutral-300 dark:border-neutral-600"
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
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
                        shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center overflow-hidden border
                        ${
                          isSelected
                            ? "bg-white dark:bg-[#252525] border-neutral-300 dark:border-neutral-500"
                            : "bg-white dark:bg-[#252525] border-black/5 dark:border-[#333333]"
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
                              parent.classList.add("text-lg", "font-semibold", "text-neutral-400");
                            }
                          }}
                        />
                      ) : (
                        <Plug
                          className={`w-5 h-5 ${isSelected ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"}`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${isSelected ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"}`}>
                        {tool.toolkitName}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {tool.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tool.actions.map((action) => (
                          <span
                            key={action}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f8f9fa] dark:bg-[#252525] border border-black/5 dark:border-[#333333] text-neutral-500 dark:text-neutral-400"
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
        <WizardCard className="text-center py-6 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center">
            <Plug className="w-5 h-5 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No integrations needed for this agent type.
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            You can always add tools later from the agent canvas.
          </p>
        </WizardCard>
      )}

      {/* Info note */}
      <div className="bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 border border-black/5 dark:border-[#2A2A2A] rounded-2xl p-3 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {hasTools
            ? "You'll connect these integrations after your agent is created. Each integration requires a one-time authorization."
            : "You can add integrations like Google Calendar, Gmail, or Google Sheets later from the agent's Tools tab."}
        </p>
      </div>
    </div>
  );
}

function formatActionName(action: string): string {
  const parts = action.split("_");
  const rest = parts.slice(1);
  return rest
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
