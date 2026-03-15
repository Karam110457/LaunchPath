"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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

/** 4-state model matching VAPI/LiveKit: idle → listening → thinking → speaking */
type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface TranscriptEntry {
  id: number;
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

function groupByProvider(models: ModelOption[]): Record<string, ModelOption[]> {
  const groups: Record<string, ModelOption[]> = {};
  for (const m of models) {
    (groups[m.provider] ??= []).push(m);
  }
  return groups;
}

// ─── SpeechRecognition types (Web Speech API) ────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const W = window as unknown as Record<string, unknown>;
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new (Ctor as new () => SpeechRecognitionInstance)();
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interimText, setInterimText] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  /** Tracks how much of the agent transcript has been spoken (for delayed reveal) */
  const spokenTextRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isSpeakingRef = useRef(false); // true while agent TTS is playing — suppresses mic auto-restart
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

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
    const id = Date.now();
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date(), id }]);
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return id;
  }, []);

  /** Update an existing transcript entry's text (for streaming display) */
  const updateTranscriptText = useCallback((id: number, text: string) => {
    setTranscript((prev) =>
      prev.map((e) => (e.id === id ? { ...e, text } : e))
    );
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // ─── Audio playback via AudioContext (bypasses autoplay policy) ──────────
  // AudioContext created/resumed on user gesture stays unlocked for later plays.
  const ensurePlaybackCtx = useCallback((): AudioContext => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === "closed") {
      playbackCtxRef.current = new AudioContext();
    }
    if (playbackCtxRef.current.state === "suspended") {
      playbackCtxRef.current.resume();
    }
    return playbackCtxRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch { /* already stopped */ }
      playbackSourceRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  /** Play audio from an MP3 blob using AudioContext (avoids autoplay blocks) */
  const playAudioBlob = useCallback(async (blob: Blob): Promise<void> => {
    const ctx = ensurePlaybackCtx();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Stop any current playback
    if (playbackSourceRef.current) {
      try { playbackSourceRef.current.stop(); } catch { /* ok */ }
    }

    return new Promise<void>((resolve, reject) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        playbackSourceRef.current = null;
        resolve();
      };

      playbackSourceRef.current = source;
      setIsPlaying(true);

      try {
        source.start(0);
      } catch (err) {
        console.error("[Voice] AudioContext play error:", err);
        setIsPlaying(false);
        playbackSourceRef.current = null;
        reject(err);
      }
    });
  }, [ensurePlaybackCtx]);

  /** Call the TTS API and play the result */
  const speakText = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/voice-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 500),
          voiceId: config.voiceId || "nova",
          speed: config.speed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "TTS failed" }));
        console.error("[Voice] TTS API error:", err);
        setVoiceError(err.error || "Failed to generate speech");
        setIsLoading(false);
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        console.error("[Voice] TTS returned empty blob");
        setVoiceError("Received empty audio response");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      await playAudioBlob(blob);
    } catch (err) {
      console.error("[Voice] speakText error:", err);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [agentId, config.voiceId, config.speed, playAudioBlob]);

  // ─── Sentence-level TTS helper ──────────────────────────────────────────
  // Fetches TTS for a single sentence and plays it. Returns when audio finishes.
  // Also updates voiceState and reveals transcript text as each sentence is spoken.
  const speakSentence = useCallback(async (
    sentence: string,
    transcriptId?: number,
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/agents/${agentId}/voice-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sentence.slice(0, 500),
          voiceId: config.voiceId || "nova",
          speed: config.speed,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (blob.size === 0) return;

      // Transition to speaking and reveal this sentence in transcript
      setVoiceState("speaking");
      spokenTextRef.current = (spokenTextRef.current + " " + sentence).trim();
      if (transcriptId) {
        updateTranscriptText(transcriptId, spokenTextRef.current);
      }

      await playAudioBlob(blob);
    } catch {
      // Non-fatal: skip this sentence's audio
    }
  }, [agentId, config.voiceId, config.speed, playAudioBlob, updateTranscriptText]);

  // ─── Sentence boundary detection ──────────────────────────────────────────
  // Splits on sentence-ending punctuation, avoids false positives (Dr., Mr., etc.)
  const ABBREVIATIONS = /(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|Ave|St|Blvd)\.\s*$/i;

  const extractSentences = useCallback((text: string): { sentences: string[]; remainder: string } => {
    const sentences: string[] = [];
    let remainder = text;

    // Match sentence-ending punctuation followed by a space or end of string
    const re = /[.!?]+[\s]+/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(remainder)) !== null) {
      const candidate = remainder.slice(lastIndex, match.index + match[0].length).trim();
      // Skip abbreviations and very short fragments
      if (candidate.length >= 10 && !ABBREVIATIONS.test(candidate)) {
        sentences.push(candidate);
        lastIndex = match.index + match[0].length;
      }
    }

    return { sentences, remainder: remainder.slice(lastIndex) };
  }, [ABBREVIATIONS]);

  // ─── Streaming voice loop ─────────────────────────────────────────────────
  // Like VAPI/Retell: stream LLM tokens → detect sentence boundaries →
  // send each sentence to TTS immediately → play audio while LLM still generates.
  // Transcript updates progressively as text arrives.
  const handleRecognizedSpeech = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setVoiceState("thinking");
    setVoiceError(null);
    spokenTextRef.current = "";

    // Half-duplex: pause recognition so mic doesn't pick up TTS output
    isSpeakingRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ok */ }
    }

    // Add user speech to transcript
    addTranscriptEntry("user", text);

    // Create a transcript entry — text revealed as each sentence is SPOKEN (not generated)
    const agentEntryId = addTranscriptEntry("agent", "");

    // Conversation history
    conversationHistoryRef.current.push({ role: "user", content: text });

    const controller = new AbortController();
    abortRef.current = controller;

    // Voice system instruction (same pattern as VAPI/Retell)
    const voiceSystemMessage = mode === "voice" ? {
      role: "system",
      content: "You are currently in a VOICE conversation. The user is speaking to you and will hear your response read aloud. Follow these rules strictly:\n" +
        "Keep every response to 1 to 2 sentences maximum.\n" +
        "Ask only one question at a time, never stack questions.\n" +
        "Never use emojis, markdown formatting, bullet points, or dashes.\n" +
        "Use natural spoken language with contractions.\n" +
        "Say dates and numbers in spoken form (e.g. say January fifteenth, not 1/15).\n" +
        "Be warm and conversational, not robotic.",
    } : null;

    const apiMessages = [
      ...(voiceSystemMessage ? [voiceSystemMessage] : []),
      ...conversationHistoryRef.current.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, userMessage: text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat API returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let fullText = "";
      let sentenceBuffer = "";
      // Chain TTS playback: each sentence waits for the previous to finish
      let ttsChain = Promise.resolve();

      // Read the SSE stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const chunks = sseBuffer.split("\n\n");
        sseBuffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const json = chunk.slice(6);
          if (json === "[DONE]") continue;

          try {
            const event = JSON.parse(json);
            if (event.type === "text-delta" && event.delta) {
              fullText += event.delta;
              sentenceBuffer += event.delta;

              // Check for complete sentences — send each to TTS immediately
              // Transcript text is revealed inside speakSentence as audio plays
              const { sentences, remainder } = extractSentences(sentenceBuffer);
              if (sentences.length > 0) {
                sentenceBuffer = remainder;
                for (const s of sentences) {
                  ttsChain = ttsChain.then(() => speakSentence(s, agentEntryId));
                }
              }
            } else if (event.type === "done" && event.text) {
              fullText = event.text;
            }
          } catch {
            // Skip malformed SSE events
          }
        }
      }

      // Flush remaining text as final sentence
      if (sentenceBuffer.trim()) {
        ttsChain = ttsChain.then(() => speakSentence(sentenceBuffer.trim(), agentEntryId));
      }

      // Wait for all queued TTS to finish playing
      await ttsChain;

      // Save final text to conversation history and ensure full transcript is shown
      if (fullText) {
        conversationHistoryRef.current.push({ role: "assistant", content: fullText });
        updateTranscriptText(agentEntryId, fullText);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[Voice] Conversation loop error:", err);
        setVoiceError("Failed to get agent response");
      }
    } finally {
      setIsProcessing(false);
      setVoiceState("listening");

      // Resume recognition after all TTS finishes
      isSpeakingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* may already be started */ }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, agentId, mode, addTranscriptEntry, updateTranscriptText, speakSentence, extractSentences]);

  // ─── Start / stop voice ─────────────────────────────────────────────────
  // getUserMedia MUST be called directly in the click handler (user gesture)
  // so the browser shows the permission prompt. Calling it in useEffect loses
  // the transient activation and Edge/Chrome silently deny.

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }
    setMicStream(null);
    setIsListening(false);
    setVoiceState("idle");
    setInterimText("");
  }, [micStream]);

  const startVoice = useCallback(async () => {
    // Prime the playback AudioContext during user gesture so TTS audio
    // can play later without being blocked by autoplay policy.
    ensurePlaybackCtx();

    // Step 1: Acquire mic — MUST happen in the click call-stack
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Voice] getUserMedia failed:", errMsg);

      // Distinguish Permissions-Policy block from user denial
      if (errMsg.includes("Permissions Policy") || errMsg.includes("permissions policy")) {
        setVoiceError(
          "Microphone blocked by site policy. Please try refreshing the page (Ctrl+Shift+R)."
        );
      } else {
        // Check user-level permission state
        try {
          const perm = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (perm.state === "denied") {
            setVoiceError(
              "Microphone blocked. Click the lock icon in the address bar and reset Microphone to \"Ask\"."
            );
          } else {
            setVoiceError("Microphone access denied. Check browser permissions.");
          }
        } catch {
          setVoiceError("Microphone access denied. Check browser permissions.");
        }
      }
      return;
    }

    setMicStream(stream);
    setVoiceError(null);
    setIsListening(true);
    setVoiceState("listening");

    // Step 2: Start SpeechRecognition (mic already allowed)
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setVoiceError("Speech recognition not supported in this browser. Try Chrome or Edge.");
      stream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      setIsListening(false);
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const txt = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += txt;
        } else {
          interim += txt;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        setInterimText("");
        handleRecognizedSpeech(finalText.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[Voice] SpeechRecognition error:", event.error, event.message);
      if (event.error === "not-allowed") {
        setVoiceError("Microphone blocked. Click the lock icon in the address bar → reset Microphone.");
        setIsListening(false);
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setVoiceError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening — but NOT while agent is speaking
      // (half-duplex: mic stays paused during TTS to prevent echo feedback loop)
      if (recognitionRef.current === recognition && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch {
          // May fail if already started — ignore
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      console.log("[Voice] Mic acquired + SpeechRecognition started");
    } catch (err) {
      console.error("[Voice] Failed to start SpeechRecognition:", err);
      setVoiceError("Failed to start speech recognition");
      setIsListening(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRecognizedSpeech, ensurePlaybackCtx]);

  // Cleanup on unmount or mode switch
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (playbackCtxRef.current && playbackCtxRef.current.state !== "closed") {
        playbackCtxRef.current.close();
      }
    };
  }, []);

  // ─── Play greeting ───────────────────────────────────────────────────────
  const playGreeting = useCallback(async () => {
    stopPlayback();
    const text = greetingMessage || "Hello! How can I help you today?";
    addTranscriptEntry("agent", text);
    setShowTranscript(true);
    await speakText(text);
  }, [greetingMessage, stopPlayback, addTranscriptEntry, speakText]);

  const handlePlayStop = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      ensurePlaybackCtx(); // Unlock AudioContext during user gesture
      playGreeting();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Auto-show transcript when there are entries
  useEffect(() => {
    if (transcript.length > 0 && !showTranscript) {
      setShowTranscript(true);
    }
  }, [transcript.length, showTranscript]);

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

            {/* Error banner */}
            <AnimatePresence>
              {voiceError && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <div className="mx-4 mt-2 rounded-lg bg-red-50/80 canvas-dark:bg-red-950/30 border border-red-200/50 canvas-dark:border-red-500/20 px-3 py-2">
                    <p className="text-[11px] text-red-700 canvas-dark:text-red-300">{voiceError}</p>
                    <button
                      type="button"
                      onClick={() => setVoiceError(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orb area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0">
              <div className="w-40 h-40 relative">
                <VoicePoweredOrb
                  enableVoiceControl={isListening}
                  mediaStream={micStream}
                  className="rounded-2xl overflow-hidden"
                  onVoiceDetected={setVoiceDetected}
                  voiceSensitivity={2}
                  hue={voiceState === "thinking" ? 40 : voiceState === "speaking" ? 270 : undefined}
                />
              </div>

              {/* Status text — 4-state model: idle / listening / thinking / speaking */}
              <p className={cn(
                "mt-3 text-xs text-center transition-colors",
                voiceState === "thinking"
                  ? "text-amber-500 canvas-dark:text-amber-400 animate-pulse"
                  : voiceState === "speaking"
                    ? "text-violet-500 canvas-dark:text-violet-400"
                    : "text-neutral-500 canvas-dark:text-neutral-400"
              )}>
                {voiceState === "thinking"
                  ? "Thinking..."
                  : voiceState === "speaking"
                    ? "Speaking..."
                    : isListening
                      ? interimText
                        ? `"${interimText}"`
                        : voiceDetected
                          ? "Listening..."
                          : "Speak now..."
                      : "Tap the mic to start"}
              </p>

              {/* Mic + Play + Transcript controls */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => isListening ? stopVoice() : startVoice()}
                  disabled={isProcessing}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "gradient-accent-bg text-white shadow-lg shadow-orange-500/20 scale-110"
                      : "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-600 canvas-dark:text-neutral-300 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700",
                    isProcessing && "opacity-50 cursor-not-allowed"
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
                  disabled={isLoading || isProcessing}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isPlaying
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-600 canvas-dark:text-neutral-300 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700",
                    (isLoading || isProcessing) && "opacity-50 cursor-not-allowed"
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
                          onClick={() => {
                            setTranscript([]);
                            conversationHistoryRef.current = [];
                          }}
                          className="text-[10px] text-neutral-400 canvas-dark:text-neutral-500 hover:text-neutral-600 canvas-dark:hover:text-neutral-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                      {transcript.length === 0 && !interimText ? (
                        <p className="text-[11px] text-neutral-400 canvas-dark:text-neutral-500 text-center py-6">
                          Transcript will appear here as you speak
                        </p>
                      ) : (
                        <>
                          {transcript.map((entry) => (
                            <div
                              key={entry.id}
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
                                {entry.text || (
                                  <span className="inline-flex gap-1 items-center text-neutral-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:300ms]" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Show interim (live) text while speaking */}
                          {interimText && (
                            <div className="flex justify-end">
                              <div className="max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-relaxed bg-neutral-100/60 canvas-dark:bg-neutral-800/40 text-neutral-400 canvas-dark:text-neutral-500 italic">
                                {interimText}...
                              </div>
                            </div>
                          )}
                          {/* Processing indicator */}
                          {isProcessing && (
                            <div className="flex justify-start">
                              <div className="rounded-xl px-3 py-1.5 text-[11px] bg-white/60 canvas-dark:bg-neutral-800/60 border border-neutral-200/40 canvas-dark:border-neutral-700/40 text-neutral-400 canvas-dark:text-neutral-500 flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Thinking...
                              </div>
                            </div>
                          )}
                        </>
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
