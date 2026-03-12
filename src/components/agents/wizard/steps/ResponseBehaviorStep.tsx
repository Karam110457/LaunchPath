"use client";

import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";
import { CustomFieldsList } from "../shared/CustomFieldsList";
import type { CustomerSupportConfig } from "@/types/agent-wizard";

interface ResponseBehaviorStepProps {
  config: CustomerSupportConfig;
  onUpdate: (
    updater: (prev: CustomerSupportConfig) => CustomerSupportConfig,
  ) => void;
}

export function ResponseBehaviorStep({ config, onUpdate }: ResponseBehaviorStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="How should your agent respond?"
        description="Set the response style and any topics your agent should avoid."
      />

      {/* Response style */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, response_style: "concise" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.response_style === "concise"
              ? "ring-2 ring-[#FF8C00]/30 border-transparent bg-white dark:bg-[#252525] shadow-[0_0_20px_-5px_rgba(157,80,187,0.15)]"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.response_style === "concise" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Concise answers
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Short, direct responses that get to the point quickly.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onUpdate((prev) => ({ ...prev, response_style: "detailed" }))}
          className={`w-full text-left rounded-[20px] border p-5 transition-all duration-200 ${
            config.response_style === "detailed"
              ? "ring-2 ring-[#FF8C00]/30 border-transparent bg-white dark:bg-[#252525] shadow-[0_0_20px_-5px_rgba(157,80,187,0.15)]"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-neutral-300 dark:hover:border-neutral-500"
          }`}
        >
          <p className={`text-sm font-medium ${config.response_style === "detailed" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}>
            Detailed explanations
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Thorough, step-by-step responses with extra context.
          </p>
        </button>
      </div>

      {/* Forbidden topics */}
      <WizardCard>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Forbidden topics
              <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">(optional)</span>
            </Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Topics your agent must never discuss. It will politely redirect if asked.
            </p>
          </div>
          <CustomFieldsList
            fields={config.forbidden_topics}
            onChange={(forbidden_topics) =>
              onUpdate((prev) => ({ ...prev, forbidden_topics }))
            }
            placeholder="e.g., Competitor pricing, Internal processes"
          />
        </div>
      </WizardCard>
    </div>
  );
}
