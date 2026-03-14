"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, MessageSquare, Volume2 } from "lucide-react";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { VoiceSettingsPanel } from "./panels/VoiceSettingsPanel";
import { PANEL_SLIDE } from "./animation-constants";
import { cn } from "@/lib/utils";
import type { AgentVoiceSettings } from "@/lib/channels/types";

type TestMode = "chat" | "voice";

interface FloatingChatWidgetProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
  voiceConfig: AgentVoiceSettings | null;
  onVoiceConfigUpdate: (config: AgentVoiceSettings | null) => void;
  onClose: () => void;
}

const chatVariants = {
  initial: { x: 24, opacity: 0, scale: 0.97 },
  animate: { x: 0, opacity: 1, scale: 1 },
  exit: { x: 24, opacity: 0, scale: 0.97 },
};

export function FloatingChatWidget({
  agentId,
  agentName,
  greetingMessage,
  voiceConfig,
  onVoiceConfigUpdate,
  onClose,
}: FloatingChatWidgetProps) {
  const [mode, setMode] = useState<TestMode>("chat");

  return (
    <motion.div
      className="fixed top-[84px] right-6 bottom-6 z-50 w-[380px] flex flex-col bg-white/70 canvas-dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden"
      variants={chatVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PANEL_SLIDE.transition}
    >
      {/* Gradient accent line */}
      <div className="h-[2px] gradient-accent-bg shrink-0 mx-6 mt-4 rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50 shrink-0">
        <div className="flex items-center gap-1 bg-neutral-100/80 canvas-dark:bg-neutral-800/80 rounded-full p-0.5">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              mode === "chat"
                ? "bg-white canvas-dark:bg-neutral-700 text-neutral-900 canvas-dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 canvas-dark:text-neutral-400 hover:text-neutral-700 canvas-dark:hover:text-neutral-200"
            )}
          >
            <MessageSquare className="w-3 h-3" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMode("voice")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              mode === "voice"
                ? "bg-white canvas-dark:bg-neutral-700 text-neutral-900 canvas-dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 canvas-dark:text-neutral-400 hover:text-neutral-700 canvas-dark:hover:text-neutral-200"
            )}
          >
            <Volume2 className="w-3 h-3" />
            Voice
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400 font-bold" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {mode === "chat" ? (
          <AgentChatPanel
            agentId={agentId}
            agentName={agentName}
            greetingMessage={greetingMessage}
            embedded
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <VoiceSettingsPanel
              voiceConfig={voiceConfig}
              greetingMessage={greetingMessage ?? ""}
              onUpdate={onVoiceConfigUpdate}
              agentId={agentId}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
