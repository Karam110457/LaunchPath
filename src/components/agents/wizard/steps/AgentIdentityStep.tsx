"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

interface AgentIdentityStepProps {
  agentName: string;
  agentDescription: string;
  tone: string;
  greetingMessage: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onToneChange: (tone: string) => void;
  onGreetingChange: (greeting: string) => void;
}

export function AgentIdentityStep({
  agentName,
  agentDescription,
  tone,
  greetingMessage,
  onNameChange,
  onDescriptionChange,
  onToneChange,
  onGreetingChange,
}: AgentIdentityStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Give your agent an identity"
        description="Name your agent and set the tone for how it greets visitors."
      />

      {/* Name + Description card */}
      <WizardCard>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Agent name
            </Label>
            <Input
              id="agent-name"
              placeholder="e.g., Sarah, BookingBot, Support Assistant"
              value={agentName}
              onChange={(e) => onNameChange(e.target.value)}
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              The name visitors will see when chatting.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-description" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Short description
              <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
            </Label>
            <Input
              id="agent-description"
              placeholder="e.g., Friendly booking assistant for Smith Roofing"
              value={agentDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
          </div>
        </div>
      </WizardCard>

      {/* Personality card */}
      <WizardCard>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-tone" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Communication tone
            </Label>
            <Input
              id="agent-tone"
              placeholder="e.g., friendly and efficient, warm and professional"
              value={tone}
              onChange={(e) => onToneChange(e.target.value)}
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              A short phrase describing how your agent communicates.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-greeting" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
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
        </div>
      </WizardCard>
    </div>
  );
}
