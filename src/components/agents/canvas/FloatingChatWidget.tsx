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
    <div className="fixed top-[84px] right-6 bottom-6 z-50 w-[380px] flex flex-col bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/60 dark:border-zinc-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-right-8 duration-200">
      {/* Gradient accent line */}
      <div className="h-[2px] gradient-accent-bg shrink-0 mx-6 mt-4 rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200/50 dark:border-zinc-700/50 shrink-0">
        <span className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
          Chat with {agentName}
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400 font-bold" />
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
