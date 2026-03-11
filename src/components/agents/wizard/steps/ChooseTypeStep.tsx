"use client";

import { AGENT_TEMPLATES } from "@/lib/agents/templates";
import { Calendar, LifeBuoy, Target, Sparkles, Bot } from "lucide-react";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Calendar,
  LifeBuoy,
  Target,
};

interface ChooseTypeStepProps {
  templateId: string | null;
  onSelect: (id: "appointment-booker" | "customer-support" | "lead-capture" | "custom") => void;
}

export function ChooseTypeStep({ templateId, onSelect }: ChooseTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          What type of agent do you want to build?
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a template to get started, or build a custom agent from
          scratch with the guided setup.
        </p>
      </div>

      <div className="space-y-3">
        {AGENT_TEMPLATES.map((template) => {
          const Icon = ICON_MAP[template.icon] ?? Sparkles;
          const isSelected = templateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() =>
                onSelect(
                  template.id as "appointment-booker" | "customer-support" | "lead-capture",
                )
              }
              className={`
                w-full text-left px-5 py-4 rounded-xl border transition-all duration-200
                hover:border-primary/40 hover:bg-primary/5
                focus:outline-none focus:ring-2 focus:ring-primary/50
                ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                    : "border-border bg-card"
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                    ${isSelected ? "bg-primary/20" : "bg-muted"}
                  `}
                >
                  <Icon
                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <div
                    className={`font-medium ${isSelected ? "text-primary" : ""}`}
                  >
                    {template.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {template.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Custom agent — no template */}
        <button
          type="button"
          onClick={() => onSelect("custom")}
          className={`
            w-full text-left px-5 py-4 rounded-xl border transition-all duration-200
            hover:border-primary/40 hover:bg-primary/5
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${
              templateId === "custom"
                ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                : "border-border bg-card"
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div
              className={`
                h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                ${templateId === "custom" ? "bg-primary/20" : "bg-muted"}
              `}
            >
              <Bot
                className={`h-5 w-5 ${templateId === "custom" ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <div
                className={`font-medium ${templateId === "custom" ? "text-primary" : ""}`}
              >
                Custom Agent
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Build any type of agent with the guided setup. No predefined
                behavior or tools — you configure everything.
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
