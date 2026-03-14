"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Volume2,
  Mic,
  MicOff,
  Play,
  Square,
  Loader2,
  Settings2,
  AlertTriangle,
  FileText,
  ChevronDown,
  Zap,
} from "lucide-react";
import { AgentChatPanel } from "@/components/agents/AgentChatPanel";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { PANEL_SLIDE } from "./animation-constants";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { AgentVoiceSettings } from "@/lib/channels/types";
import {
  isVoiceReadyModel,
  getVoiceReadyModels,
  getModelInfo,
  type ModelOption,
} from "@/lib/ai/model-tiers";

type TestMode = "chat" | "voice";

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

interface FloatingChatWidgetProps {
  agentId: string;
  agentName: string;
  greetingMessage?: string;
  voiceConfig: AgentVoiceSettings | null;
  onVoiceConfigUpdate: (config: AgentVoiceSettings | null) => void;
  agentModel: string;
  onModelChange: (model: string) => void;
  onClose: () => void;
}

const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "ash", name: "Ash" },
  { id: "ballad", name: "Ballad" },
  { id: "coral", name: "Coral" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "nova", name: "Nova" },
  { id: "onyx", name: "Onyx" },
  { id: "sage", name: "Sage" },
  { id: "shimmer", name: "Shimmer" },
];

const DEFAULT_VOICE_CONFIG: AgentVoiceSettings = {
  ttsProvider: "openai",
  voiceId: "nova",
  voiceName: "Nova",
  speed: 1,
};

const chatVariants = {
  initial: { x: 24, opacity: 0, scale: 0.97 },
  animate: { x: 0, opacity: 1, scale: 1 },
  exit: { x: 24, opacity: 0, scale: 0.97 },
};

/** Group voice-ready models by provider for the quick-switch dropdown */
function groupByProvider(models: ModelOption[]): Record<string, ModelOption[]> {
  const groups: Record<string, ModelOption[]> = {};
  for (const m of models) {
    (groups[m.provider] ??= []).push(m);
  }
  return groups;
}

export function FloatingChatWidget({
  agentId,
  agentName,
  greetingMessage,
  voiceConfig,
  onVoiceConfigUpdate,
  agentModel,
  onModelChange,
  onClose,
}: FloatingChatWidgetProps) {
  const [mode, setMode] = useState<TestMode>("chat");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const config = voiceConfig ?? DEFAULT_VOICE_CONFIG;
  const voiceReady = isVoiceReadyModel(agentModel);
  const currentModelInfo = getModelInfo(agentModel);
  const voiceModels = useMemo(() => getVoiceReadyModels(), []);
  const voiceModelGroups = useMemo(() => groupByProvider(voiceModels), [voiceModels]);

  const updateConfig = useCallback(
    (partial: Partial<AgentVoiceSettings>) => {
      onVoiceConfigUpdate({ ...config, ...partial });
    },
    [config, onVoiceConfigUpdate]
  );

  const addTranscriptEntry = useCallback((role: "user" | "agent", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date() }]);
    // Auto-scroll after React re-render
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const playPreview = useCallback(async () => {
    stopPlayback();
    setIsLoading(true);

    const text = greetingMessage || "Hello! How can I help you today?";

    try {
      const res = await fetch(`/api/agents/${agentId}/voice-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: config.voiceId || "nova",
          speed: config.speed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Preview failed" }));
        throw new Error(err.error || "Preview failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      // Add agent greeting to transcript
      addTranscriptEntry("agent", text);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audioRef.current = audio;
      setIsLoading(false);
      setIsPlaying(true);
      await audio.play();
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [agentId, greetingMessage, config.voiceId, config.speed, stopPlayback, addTranscriptEntry]);

  const handlePlayStop = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playPreview();
    }
  };

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
          <div className="flex flex-col h-full">
            {/* Voice model warning banner */}
            <AnimatePresence>
              {!voiceReady && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden shrink-0"
                >
                  <div className="mx-4 mt-3 rounded-xl border border-amber-200/60 canvas-dark:border-amber-500/20 bg-amber-50/80 canvas-dark:bg-amber-950/30 px-3.5 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-amber-800 canvas-dark:text-amber-300">
                          {currentModelInfo?.label ?? agentModel} may have high latency for voice
                        </p>
                        <p className="text-[10px] text-amber-600 canvas-dark:text-amber-400/70 mt-0.5">
                          Switch to a low-latency model for a better voice experience.
                        </p>
                        <div className="relative mt-2">
                          <button
                            type="button"
                            onClick={() => setShowModelPicker((prev) => !prev)}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 canvas-dark:text-amber-300 hover:text-amber-900 canvas-dark:hover:text-amber-200 transition-colors"
                          >
                            <Zap className="w-3 h-3" />
                            Switch to voice-optimized model
                            <ChevronDown className={cn(
                              "w-3 h-3 transition-transform",
                              showModelPicker && "rotate-180"
                            )} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick-switch model picker */}
                    <AnimatePresence>
                      {showModelPicker && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 max-h-[180px] overflow-y-auto rounded-lg border border-amber-200/40 canvas-dark:border-amber-500/10 bg-white/60 canvas-dark:bg-neutral-900/60">
                            {Object.entries(voiceModelGroups).map(([provider, models]) => (
                              <div key={provider}>
                                <div className="px-2.5 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400 canvas-dark:text-neutral-500">
                                  {provider}
                                </div>
                                {models.map((m) => (
                                  <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => {
                                      onModelChange(m.value);
                                      setShowModelPicker(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] hover:bg-amber-100/50 canvas-dark:hover:bg-amber-900/20 transition-colors",
                                      m.value === agentModel && "bg-amber-100/60 canvas-dark:bg-amber-900/30 font-medium"
                                    )}
                                  >
                                    <span className="text-neutral-700 canvas-dark:text-neutral-300 truncate">
                                      {m.label}
                                    </span>
                                    <span className="text-[9px] text-neutral-400 canvas-dark:text-neutral-500 shrink-0 ml-2">
                                      {m.tier}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orb area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0">
              <div className="w-48 h-48 relative">
                <VoicePoweredOrb
                  enableVoiceControl={isListening}
                  className="rounded-2xl overflow-hidden"
                  onVoiceDetected={setVoiceDetected}
                  voiceSensitivity={2}
                />
              </div>

              {/* Status text */}
              <p className="mt-4 text-xs text-neutral-500 canvas-dark:text-neutral-400 text-center">
                {isLoading
                  ? "Generating audio..."
                  : isPlaying
                    ? "Playing response..."
                    : isListening
                      ? voiceDetected
                        ? "Listening..."
                        : "Speak now..."
                      : "Tap the mic to start"}
              </p>

              {/* Mic + Play + Transcript controls */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsListening((prev) => !prev)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "gradient-accent-bg text-white shadow-lg shadow-orange-500/20 scale-110"
                      : "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-600 canvas-dark:text-neutral-300 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700"
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePlayStop}
                  disabled={isLoading}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isPlaying
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-600 canvas-dark:text-neutral-300 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                {/* Transcript toggle */}
                <button
                  type="button"
                  onClick={() => setShowTranscript((prev) => !prev)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    showTranscript
                      ? "bg-neutral-200 canvas-dark:bg-neutral-700 text-neutral-800 canvas-dark:text-neutral-100"
                      : "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-500 canvas-dark:text-neutral-400 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700"
                  )}
                  title="Show transcript"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-2 text-[10px] text-neutral-400 canvas-dark:text-neutral-500">
                {isPlaying ? "Stop" : "Play greeting"} (1 credit)
              </p>
            </div>

            {/* Transcript panel */}
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 200, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="shrink-0 overflow-hidden border-t border-neutral-200/50 canvas-dark:border-neutral-700/50"
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200/30 canvas-dark:border-neutral-700/30">
                      <span className="text-[11px] font-medium text-neutral-500 canvas-dark:text-neutral-400 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Transcript
                      </span>
                      {transcript.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTranscript([])}
                          className="text-[10px] text-neutral-400 canvas-dark:text-neutral-500 hover:text-neutral-600 canvas-dark:hover:text-neutral-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                      {transcript.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 canvas-dark:text-neutral-500 text-center py-6">
                          Transcript will appear here as you speak
                        </p>
                      ) : (
                        transcript.map((entry, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex gap-2",
                              entry.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-relaxed",
                                entry.role === "user"
                                  ? "bg-neutral-200/60 canvas-dark:bg-neutral-700/60 text-neutral-800 canvas-dark:text-neutral-200"
                                  : "bg-white/60 canvas-dark:bg-neutral-800/60 border border-neutral-200/40 canvas-dark:border-neutral-700/40 text-neutral-700 canvas-dark:text-neutral-300"
                              )}
                            >
                              {entry.text}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={transcriptEndRef} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Settings toggle */}
            <div className="border-t border-neutral-200/50 canvas-dark:border-neutral-700/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-neutral-500 canvas-dark:text-neutral-400 hover:text-neutral-700 canvas-dark:hover:text-neutral-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  Voice Settings
                </span>
                <span className="text-[10px] text-neutral-400">
                  {config.voiceName || "Nova"}
                </span>
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-3">
                      {/* Voice picker */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-neutral-500 canvas-dark:text-neutral-400">Voice</Label>
                        <Select
                          value={config.voiceId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const match = OPENAI_VOICES.find((v) => v.id === val);
                            updateConfig({ voiceId: val, voiceName: match?.name ?? val });
                          }}
                        >
                          {OPENAI_VOICES.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {/* Speed */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-neutral-500 canvas-dark:text-neutral-400">Speed</Label>
                        <Select
                          value={String(config.speed)}
                          onChange={(e) => updateConfig({ speed: parseFloat(e.target.value) })}
                        >
                          <option value="0.75">0.75x — Slow</option>
                          <option value="1">1x — Normal</option>
                          <option value="1.25">1.25x — Fast</option>
                          <option value="1.5">1.5x — Faster</option>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
