"use client";

import { X } from "lucide-react";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";

interface FloatingChatWidgetProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
  onClose: () => void;
}

export function FloatingChatWidget({
  agentId,
  agentName,
  greetingMessage,
  onClose,
}: FloatingChatWidgetProps) {
  return (
    <div className="fixed bottom-20 right-6 z-40 w-[400px] h-[520px] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/90 backdrop-blur-sm flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">
          Test {agentName}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden">
        <AgentChatPanel
          agentId={agentId}
          agentName={agentName}
          greetingMessage={greetingMessage}
          embedded
        />
      </div>
    </div>
  );
}
