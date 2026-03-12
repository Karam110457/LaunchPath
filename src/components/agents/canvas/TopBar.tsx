"use client";

import { ArrowLeft, Loader2, Check, Play, Bot, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTips } from "./tips-context";

interface TopBarProps {
  agentName: string;
  subagentCount?: number;
  toolCount?: number;
  onTest?: () => void;
  isTestOpen?: boolean;
  saveStatus?: "idle" | "saving" | "saved";
  onBack: () => void;
}

export function TopBar({
  agentName,
  subagentCount = 0,
  toolCount = 0,
  onTest,
  isTestOpen = false,
  saveStatus = "idle",
  onBack,
}: TopBarProps) {
  const { showTips, setShowTips, resetDismissed } = useTips();

  const handleToggleTips = () => {
    if (!showTips) {
      // Turning tips ON: also reset dismissed so all tips reappear
      resetDismissed();
    }
    setShowTips(!showTips);
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between px-6 py-2.5 bg-white/70 canvas-dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full w-[800px] max-w-[90vw]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-full text-neutral-600 canvas-dark:text-neutral-400 hover:text-neutral-900 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white canvas-dark:bg-neutral-800 flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-4 h-4 text-neutral-600 canvas-dark:text-neutral-400" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 leading-tight">
              {agentName || "Untitled Agent"}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 canvas-dark:text-neutral-400 flex items-center gap-1 mt-0.5">
              {subagentCount === 0 && toolCount === 0
                ? "No sub-agents or tools"
                : [
                    subagentCount === 0
                      ? null
                      : subagentCount === 1
                        ? "1 sub-agent"
                        : `${subagentCount} sub-agents`,
                    toolCount === 0
                      ? null
                      : toolCount === 1
                        ? "1 tool"
                        : `${toolCount} tools`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-xs text-neutral-500 animate-in fade-in duration-200">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-500 animate-in fade-in duration-200">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}

        {/* Tips toggle */}
        <button
          type="button"
          onClick={handleToggleTips}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all",
            showTips
              ? "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-700 canvas-dark:text-neutral-300"
              : "text-neutral-400 canvas-dark:text-neutral-500 hover:text-neutral-600 canvas-dark:hover:text-neutral-300 hover:bg-black/5 canvas-dark:hover:bg-white/5"
          )}
          title={showTips ? "Hide tips" : "Show tips"}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Tips
        </button>

        {onTest && (
          <button
            type="button"
            onClick={onTest}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all",
              isTestOpen
                ? "gradient-accent-bg text-white shadow-md"
                : "text-neutral-600 canvas-dark:text-neutral-400 hover:text-neutral-900 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5"
            )}
          >
            <Play className={cn("w-3.5 h-3.5", isTestOpen && "fill-white")} />
            Test
          </button>
        )}
      </div>
    </div>
  );
}
