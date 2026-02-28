"use client";

import { OptionCard } from "@/components/flows/OptionCard";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Who is this agent for?
        </h2>
        <p className="text-sm text-muted-foreground">
          Help your agent understand the business it represents.
        </p>
      </div>

      {/* Mode selection */}
      <div className="space-y-3">
        {hasBusinesses && (
          <OptionCard
            value="link_system"
            label="Link an existing business"
            description="Use context from a business you've already set up"
            selected={mode === "link_system"}
            onSelect={() => onModeChange("link_system")}
          />
        )}
        <OptionCard
          value="describe"
          label="Describe the business"
          description="Tell us about the business in your own words"
          selected={mode === "describe"}
          onSelect={() => onModeChange("describe")}
        />
      </div>

      {/* Expanded inputs */}
      {mode === "link_system" && hasBusinesses && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="system-select">Select a business</Label>
          <select
            id="system-select"
            value={linkedSystemId ?? ""}
            onChange={(e) => onSystemSelect(e.target.value || null)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Choose a business...</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === "describe" && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="business-desc">Business description</Label>
          <Textarea
            id="business-desc"
            placeholder="e.g., We're a roofing company in Dallas that does residential roof replacement, repair, and inspections. Our main customers are homeowners dealing with storm damage."
            value={businessDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            The more detail you provide, the better your agent will be at
            representing your business.
          </p>
        </div>
      )}
    </div>
  );
}
