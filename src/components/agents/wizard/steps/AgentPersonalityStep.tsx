"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

const TONE_PRESETS = [
  {
    id: "friendly",
    label: "Friendly & Warm",
    value: "friendly and warm",
    description: "Approachable, conversational, puts visitors at ease",
  },
  {
    id: "professional",
    label: "Professional & Polished",
    value: "professional and polished",
    description: "Clear, authoritative, builds trust and credibility",
  },
  {
    id: "casual",
    label: "Casual & Relaxed",
    value: "casual and relaxed",
    description: "Laid-back, informal, feels like chatting with a friend",
  },
] as const;

/** Inline style for gradient border via background-clip trick */
const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

interface AgentPersonalityStepProps {
  agentName: string;
  tone: string;
  greetingMessage: string;
  onToneChange: (tone: string) => void;
  onGreetingChange: (greeting: string) => void;
}

export function AgentPersonalityStep({
  agentName,
  tone,
  greetingMessage,
  onToneChange,
  onGreetingChange,
}: AgentPersonalityStepProps) {
  const displayName = agentName.trim() || "your agent";

  // Determine if current tone matches a preset
  const matchedPreset = TONE_PRESETS.find((p) => p.value === tone);
  const isCustom = tone !== "" && !matchedPreset;
  const [showCustom, setShowCustom] = useState(isCustom);

  function selectPreset(preset: typeof TONE_PRESETS[number]) {
    setShowCustom(false);
    onToneChange(preset.value);
  }

  function selectCustom() {
    setShowCustom(true);
    // If currently on a preset, clear to let them type fresh
    if (matchedPreset) onToneChange("");
  }

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title={`How should ${displayName} sound?`}
        description="Set the tone and first impression visitors will get."
      />

      {/* Tone presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 px-1">
          Communication tone
        </Label>
        <div className="space-y-2.5">
          {TONE_PRESETS.map((preset) => {
            const isSelected = !showCustom && tone === preset.value;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset)}
                className={`
                  w-full text-left rounded-[20px] border-2 px-5 py-4 transition-all duration-200
                  focus:outline-none
                  ${
                    isSelected
                      ? "[--card-bg:#ffffff] dark:[--card-bg:#252525] border-transparent"
                      : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
                  }
                `}
                style={isSelected ? gradientBorderStyle : undefined}
              >
                <p className={`text-sm font-medium ${isSelected ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
                  {preset.label}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {preset.description}
                </p>
              </button>
            );
          })}

          {/* Custom tone option */}
          <button
            type="button"
            onClick={selectCustom}
            className={`
              w-full text-left rounded-[20px] border-2 px-5 py-4 transition-all duration-200
              focus:outline-none
              ${
                showCustom
                  ? "[--card-bg:#ffffff] dark:[--card-bg:#252525] border-transparent"
                  : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
              }
            `}
            style={showCustom ? gradientBorderStyle : undefined}
          >
            <p className={`text-sm font-medium ${showCustom ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
              Custom tone
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Describe the exact voice and style you want.
            </p>
          </button>
        </div>

        {/* Custom tone input — only when custom is selected */}
        {showCustom && (
          <div className="pt-2">
            <Input
              placeholder="e.g., witty and energetic, empathetic and supportive"
              value={tone}
              onChange={(e) => onToneChange(e.target.value)}
              autoFocus
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
          </div>
        )}
      </div>

      {/* Greeting message */}
      <WizardCard>
        <div className="space-y-2">
          <Label
            htmlFor="agent-greeting"
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            Greeting message
          </Label>
          <Textarea
            id="agent-greeting"
            placeholder="e.g., Hi! I'd love to help you schedule an appointment. What service are you looking for?"
            value={greetingMessage}
            onChange={(e) => onGreetingChange(e.target.value)}
            rows={3}
            className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] resize-none"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            The first message visitors see when the chat opens.
          </p>
        </div>
      </WizardCard>
    </div>
  );
}
