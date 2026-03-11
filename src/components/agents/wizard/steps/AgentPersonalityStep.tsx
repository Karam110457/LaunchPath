"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

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

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title={`How should ${displayName} sound?`}
        description="Set the tone and first impression visitors will get."
      />

      <WizardCard>
        <div className="space-y-2">
          <Label
            htmlFor="agent-tone"
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            Communication tone
          </Label>
          <Input
            id="agent-tone"
            placeholder="e.g., friendly and efficient, warm and professional"
            value={tone}
            onChange={(e) => onToneChange(e.target.value)}
            autoFocus
            className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            A short phrase describing how {displayName} communicates.
          </p>
        </div>
      </WizardCard>

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
