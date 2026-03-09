"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { PANEL_SLIDE } from "./animation-constants";

interface FloatingChatWidgetProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
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
  onClose,
}: FloatingChatWidgetProps) {
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
        <span className="text-sm font-bold tracking-tight text-neutral-800 canvas-dark:text-neutral-200">
          Chat with {agentName}
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400 font-bold" />
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
    </motion.div>
  );
}
