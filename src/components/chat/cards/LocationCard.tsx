"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import CollapsedCard from "./CollapsedCard";
import { LOCATION_TARGET_OPTIONS } from "@/types/start-business";
import type { CardData } from "@/lib/chat/types";

interface LocationCardProps {
  card: Extract<CardData, { type: "location" }>;
  completed: boolean;
  completedSummary?: string;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function LocationCard({
  card,
  completed,
  completedSummary,
  onComplete,
}: LocationCardProps) {
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("");

  if (completed) {
    return <CollapsedCard summary={completedSummary} />;
  }

  const canSubmit = city.trim().length > 0 && target.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const targetLabel =
      LOCATION_TARGET_OPTIONS.find((o) => o.value === target)?.label ?? target;
    onComplete(
      `${city.trim()} · ${targetLabel}`,
      `[location: city="${city.trim()}", target="${target}"]`
    );
  }

  return (
    <div className="max-w-[600px] w-full space-y-5">
      {/* City input */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Where are you based?
        </Label>
        <Input
          type="text"
          placeholder="e.g. Manchester, UK"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11 rounded-xl border-border bg-card text-foreground text-sm focus-visible:ring-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>

      {/* Target location selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Where do you want to find clients?
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LOCATION_TARGET_OPTIONS.map((option) => {
            const isSelected = target === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTarget(option.value)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                  "min-h-[44px] cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted"
                )}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold"
      >
        Continue
      </Button>
    </div>
  );
}
