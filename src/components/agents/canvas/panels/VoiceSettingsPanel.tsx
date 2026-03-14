"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { OptionCard } from "@/components/flows/OptionCard";
import type { AgentVoiceSettings } from "@/lib/channels/types";

interface VoiceSettingsPanelProps {
  voiceConfig: AgentVoiceSettings | null;
  greetingMessage: string;
  onUpdate: (config: AgentVoiceSettings | null) => void;
  agentId: string;
}

const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy", desc: "Neutral and balanced" },
  { id: "ash", name: "Ash", desc: "Warm and conversational" },
  { id: "ballad", name: "Ballad", desc: "Smooth and expressive" },
  { id: "coral", name: "Coral", desc: "Clear and friendly" },
  { id: "echo", name: "Echo", desc: "Soft and steady" },
  { id: "fable", name: "Fable", desc: "Bright and engaging" },
  { id: "nova", name: "Nova", desc: "Warm and natural" },
  { id: "onyx", name: "Onyx", desc: "Deep and resonant" },
  { id: "sage", name: "Sage", desc: "Calm and measured" },
  { id: "shimmer", name: "Shimmer", desc: "Light and upbeat" },
];

const SPEED_OPTIONS = [
  { value: "0.75", label: "0.75x — Slow" },
  { value: "1", label: "1x — Normal" },
  { value: "1.25", label: "1.25x — Fast" },
  { value: "1.5", label: "1.5x — Faster" },
];

const DEFAULT_CONFIG: AgentVoiceSettings = {
  ttsProvider: "browser",
  voiceId: "",
  voiceName: "",
  speed: 1,
};

export function VoiceSettingsPanel({
  voiceConfig,
  greetingMessage,
  onUpdate,
  agentId,
}: VoiceSettingsPanelProps) {
  const config = voiceConfig ?? DEFAULT_CONFIG;
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewText, setPreviewText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      setBrowserVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const update = useCallback(
    (partial: Partial<AgentVoiceSettings>) => {
      onUpdate({ ...config, ...partial });
    },
    [config, onUpdate]
  );

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const playBrowserPreview = useCallback(() => {
    if (!window.speechSynthesis) return;
    stopPlayback();

    const text = previewText.trim() || greetingMessage || "Hello! How can I help you today?";
    const utterance = new SpeechSynthesisUtterance(text);

    const voice = browserVoices.find((v) => v.name === config.voiceId);
    if (voice) utterance.voice = voice;
    utterance.rate = config.speed;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [previewText, greetingMessage, browserVoices, config.voiceId, config.speed, stopPlayback]);

  const playOpenAIPreview = useCallback(async () => {
    stopPlayback();
    setIsLoading(true);

    const text = previewText.trim() || greetingMessage || "Hello! How can I help you today?";

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
  }, [agentId, previewText, greetingMessage, config.voiceId, config.speed, stopPlayback]);

  const handlePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (config.ttsProvider === "browser") {
      playBrowserPreview();
    } else {
      playOpenAIPreview();
    }
  };

  const voiceItems =
    config.ttsProvider === "browser"
      ? browserVoices.map((v) => ({ id: v.name, name: v.name, desc: v.lang }))
      : OPENAI_VOICES;

  return (
    <div className="space-y-6 p-1" data-scroll-container>
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">TTS Provider</Label>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard
            value="browser"
            label="Browser"
            description="Free — uses your browser's built-in speech"
            selected={config.ttsProvider === "browser"}
            onSelect={() =>
              update({ ttsProvider: "browser", voiceId: "", voiceName: "" })
            }
          />
          <OptionCard
            value="openai"
            label="OpenAI HD"
            description="High-quality voices — costs 1 credit per preview"
            selected={config.ttsProvider === "openai"}
            onSelect={() =>
              update({
                ttsProvider: "openai",
                voiceId: "nova",
                voiceName: "Nova",
              })
            }
          />
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Voice</Label>
        <Select
          value={config.voiceId}
          onChange={(e) => {
            const val = e.target.value;
            const match = voiceItems.find((v) => v.id === val);
            update({ voiceId: val, voiceName: match?.name ?? val });
          }}
        >
          <option value="">Select a voice</option>
          {voiceItems.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.desc}
            </option>
          ))}
        </Select>
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Speed</Label>
        <Select
          value={String(config.speed)}
          onChange={(e) => update({ speed: parseFloat(e.target.value) })}
        >
          {SPEED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <Textarea
          placeholder={
            greetingMessage || "Hello! How can I help you today?"
          }
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlay}
          disabled={isLoading || (!config.voiceId && config.ttsProvider !== "browser")}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating audio...
            </>
          ) : isPlaying ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Play Preview
              {config.ttsProvider === "openai" && (
                <span className="ml-1 text-muted-foreground">(1 credit)</span>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <Volume2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Voice settings define how your agent sounds in voice channels.
            Browser voices are free but quality varies by device. OpenAI HD
            voices are consistent and natural-sounding.
          </p>
        </div>
      </div>
    </div>
  );
}
