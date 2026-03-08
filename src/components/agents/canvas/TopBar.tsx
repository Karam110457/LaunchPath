"use client";

import { ArrowLeft, Save, Loader2, History, Check, Users, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopBarProps {
  agentName: string;
  avatarEmoji: string;
  onSave: () => void;
  onVersionHistory: () => void;
  onTest?: () => void;
  isSaving: boolean;
  isDirty: boolean;
  isTestOpen?: boolean;
  saveStatus?: "idle" | "saving" | "saved";
  versionCount?: number;
}

export function TopBar({
  agentName,
  avatarEmoji,
  onSave,
  onVersionHistory,
  onTest,
  isSaving,
  isDirty,
  isTestOpen = false,
  saveStatus = "idle",
  versionCount,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Leave without saving?"
      );
      if (!confirmed) return;
    }
    router.push("/dashboard/agents");
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between px-6 py-2.5 bg-white/70 canvas-dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full w-[800px] max-w-[90vw]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white canvas-dark:bg-neutral-800 flex items-center justify-center shadow-sm text-lg shrink-0">
            {avatarEmoji || "🤖"}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 leading-tight">
              {agentName || "Untitled Agent"}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 canvas-dark:text-neutral-400 flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              Team project
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

        <button
          type="button"
          onClick={onVersionHistory}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-600 canvas-dark:text-neutral-400 hover:text-neutral-900 canvas-dark:hover:text-neutral-200 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          Versions
          {typeof versionCount === "number" && versionCount > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-600 canvas-dark:text-neutral-400 px-1.5 py-0.5 rounded-full">
              {versionCount}
            </span>
          )}
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

        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-full text-[13px] font-medium transition-all",
            isDirty
              ? "gradient-accent-bg text-white shadow-md hover:opacity-90"
              : "bg-white canvas-dark:bg-neutral-800 text-neutral-400 border border-neutral-200 canvas-dark:border-neutral-700 shadow-sm cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}
