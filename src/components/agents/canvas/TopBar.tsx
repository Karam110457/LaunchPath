"use client";

import { ArrowLeft, Save, Loader2, History, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TopBarProps {
  agentName: string;
  avatarEmoji: string;
  onSave: () => void;
  onVersionHistory: () => void;
  isSaving: boolean;
  isDirty: boolean;
  saveStatus?: "idle" | "saving" | "saved";
  versionCount?: number;
}

export function TopBar({
  agentName,
  avatarEmoji,
  onSave,
  onVersionHistory,
  isSaving,
  isDirty,
  saveStatus = "idle",
  versionCount,
}: TopBarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/agents"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-lg">{avatarEmoji}</span>
        <span className="text-sm font-semibold text-foreground">
          {agentName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Autosave indicator */}
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-in fade-in duration-200">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 animate-in fade-in duration-200">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onVersionHistory}
          className="text-muted-foreground"
        >
          <History className="w-3.5 h-3.5 mr-1.5" />
          Versions
          {typeof versionCount === "number" && versionCount > 0 && (
            <span className="ml-1.5 text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded-full">
              {versionCount}
            </span>
          )}
        </Button>
        <Button
          variant={isDirty ? "default" : "outline"}
          size="sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
