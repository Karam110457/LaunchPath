"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

interface AgentNameStepProps {
  agentName: string;
  agentDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
}

export function AgentNameStep({
  agentName,
  agentDescription,
  onNameChange,
  onDescriptionChange,
}: AgentNameStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="What should we call your agent?"
        description="Give your agent a name that visitors will see when chatting."
      />

      <WizardCard>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="agent-name"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Agent name
            </Label>
            <Input
              id="agent-name"
              placeholder="e.g., Sarah, BookingBot, Support Assistant"
              value={agentName}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] text-base h-11"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              This is the name visitors will see in the chat widget.
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="agent-description"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Short description
              <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
                (optional)
              </span>
            </Label>
            <Input
              id="agent-description"
              placeholder="e.g., Friendly booking assistant for Smith Roofing"
              value={agentDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A]"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              A quick summary of what this agent does — helps you stay organized.
            </p>
          </div>
        </div>
      </WizardCard>
    </div>
  );
}
