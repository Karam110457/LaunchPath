"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

interface BusinessContextStepProps {
  businessDescription: string;
  onDescriptionChange: (desc: string) => void;
}

export function BusinessContextStep({
  businessDescription,
  onDescriptionChange,
}: BusinessContextStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Tell your agent about the business"
        description="Your agent needs context to represent the business accurately in conversations."
      />

      <WizardCard>
        <div className="space-y-2">
          <Label
            htmlFor="business-desc"
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            Business description
          </Label>
          <Textarea
            id="business-desc"
            placeholder="e.g., We're a roofing company in Dallas that does residential roof replacement, repair, and inspections. Our main customers are homeowners dealing with storm damage."
            value={businessDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            autoFocus
            className="min-h-[120px] rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              The more detail you provide, the better your agent will be.
            </p>
            <span
              className={`text-xs tabular-nums ${businessDescription.trim().length > 10 ? "text-neutral-400" : "text-amber-500"}`}
            >
              {businessDescription.trim().length}/10 min
            </span>
          </div>
        </div>
      </WizardCard>
    </div>
  );
}
