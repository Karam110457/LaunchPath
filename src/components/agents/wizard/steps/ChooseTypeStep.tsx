"use client";

import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { Calendar, LifeBuoy, Target } from "lucide-react";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Calendar,
  LifeBuoy,
  Target,
};

interface ChooseTypeStepProps {
  templateId: string | null;
  onSelect: (id: "appointment-booker" | "customer-support" | "lead-capture") => void;
}

export function ChooseTypeStep({ templateId, onSelect }: ChooseTypeStepProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="What type of agent do you want to build?"
        description="Choose a template to get started."
      />

      <div className="stagger-enter space-y-3">
        {AGENT_TEMPLATES.map((template, i) => {
          const Icon = ICON_MAP[template.icon] ?? Calendar;
          const isSelected = templateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              style={{ "--stagger": i } as React.CSSProperties}
              onClick={() =>
                onSelect(
                  template.id as "appointment-booker" | "customer-support" | "lead-capture",
                )
              }
              className={`
                w-full text-left px-6 py-5 rounded-[20px] border transition-all duration-200
                focus:outline-none
                ${
                  isSelected
                    ? "ring-2 ring-[#FF8C00]/30 border-transparent bg-white dark:bg-[#252525] shadow-[0_0_20px_-5px_rgba(157,80,187,0.15)]"
                    : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:bg-white dark:hover:bg-[#252525] hover:shadow-sm hover:-translate-y-0.5"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    h-[48px] w-[48px] rounded-[16px] flex items-center justify-center shrink-0 border transition-transform
                    ${
                      isSelected
                        ? "bg-white dark:bg-[#252525] border-[#FF8C00]/20"
                        : "bg-white dark:bg-[#252525] border-black/5 dark:border-[#333333]"
                    }
                  `}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ stroke: "url(#wizard-icon-gradient)" }}
                  />
                </div>
                <div>
                  <div
                    className={`font-medium ${isSelected ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}`}
                  >
                    {template.name}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {template.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
}
