"use client";

import { Building2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardStepHeader } from "../shared/WizardStepHeader";
import { WizardCard } from "../shared/WizardCard";

interface BusinessContextStepProps {
  mode: "link_system" | "describe" | null;
  linkedSystemId: string | null;
  businessDescription: string;
  businesses: Array<{ id: string; name: string }>;
  onModeChange: (mode: "link_system" | "describe") => void;
  onSystemSelect: (id: string | null) => void;
  onDescriptionChange: (desc: string) => void;
}

export function BusinessContextStep({
  mode,
  linkedSystemId,
  businessDescription,
  businesses,
  onModeChange,
  onSystemSelect,
  onDescriptionChange,
}: BusinessContextStepProps) {
  const hasBusinesses = businesses.length > 0;

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Tell your agent about the business"
        description="Give your agent enough context to represent the business accurately."
      />

      {/* Mode selection */}
      <div className="space-y-3">
        {hasBusinesses && (
          <button
            type="button"
            onClick={() => onModeChange("link_system")}
            className={`w-full text-left rounded-[20px] border p-4 transition-all duration-200 ${
              mode === "link_system"
                ? "border-[#FF8C00]/40 bg-gradient-to-r from-[#FF8C00]/5 to-[#9D50BB]/5 shadow-sm"
                : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-[#FF8C00]/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[14px] bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div>
                <p className={`text-sm font-medium ${mode === "link_system" ? "text-[#FF8C00]" : "text-neutral-800 dark:text-neutral-200"}`}>
                  Link an existing business
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Use context from a business you&apos;ve already set up.
                </p>
              </div>
            </div>
          </button>
        )}
        <button
          type="button"
          onClick={() => onModeChange("describe")}
          className={`w-full text-left rounded-[20px] border p-4 transition-all duration-200 ${
            mode === "describe"
              ? "border-[#FF8C00]/40 bg-gradient-to-r from-[#FF8C00]/5 to-[#9D50BB]/5 shadow-sm"
              : "border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 hover:border-[#FF8C00]/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div>
              <p className={`text-sm font-medium ${mode === "describe" ? "text-[#FF8C00]" : "text-neutral-800 dark:text-neutral-200"}`}>
                Describe the business
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Tell us about the business in your own words.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Linked system selector */}
      {mode === "link_system" && hasBusinesses && (
        <WizardCard>
          <div className="space-y-2">
            <Label htmlFor="system-select" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Select a business
            </Label>
            <select
              id="system-select"
              value={linkedSystemId ?? ""}
              onChange={(e) => onSystemSelect(e.target.value || null)}
              className="w-full h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 text-sm text-neutral-900 dark:text-neutral-200"
            >
              <option value="">Choose a business...</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </WizardCard>
      )}

      {/* Business description */}
      {mode === "describe" && (
        <WizardCard>
          <div className="space-y-2">
            <Label htmlFor="business-desc" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Business description
            </Label>
            <Textarea
              id="business-desc"
              placeholder="e.g., We're a roofing company in Dallas that does residential roof replacement, repair, and inspections. Our main customers are homeowners dealing with storm damage."
              value={businessDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="min-h-[120px] rounded-xl bg-white dark:bg-[#151515] border-neutral-200/60 dark:border-[#2A2A2A] resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                The more detail you provide, the better your agent will be.
              </p>
              <span className={`text-xs tabular-nums ${businessDescription.trim().length > 10 ? "text-neutral-400" : "text-amber-500"}`}>
                {businessDescription.trim().length}/10 min
              </span>
            </div>
          </div>
        </WizardCard>
      )}

    </div>
  );
}
