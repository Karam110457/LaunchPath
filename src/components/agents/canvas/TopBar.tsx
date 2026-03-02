"use client";

import { ArrowLeft, Save, Loader2, History, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TopBarProps {
  agentName: string;
  status: "draft" | "active" | "paused";
  avatarEmoji: string;
  onSave: () => void;
  onVersionHistory: () => void;
  onTools: () => void;
  isSaving: boolean;
  isDirty: boolean;
  toolCount?: number;
}

export function TopBar({
  agentName,
  status,
  avatarEmoji,
  onSave,
  onVersionHistory,
  onTools,
  isSaving,
  isDirty,
  toolCount,
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
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {status}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTools}
          className="text-muted-foreground relative"
        >
          <Wrench className="w-3.5 h-3.5 mr-1.5" />
          Tools
          {toolCount !== undefined && toolCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-none">
              {toolCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onVersionHistory}
          className="text-muted-foreground"
        >
          <History className="w-3.5 h-3.5 mr-1.5" />
          Versions
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
