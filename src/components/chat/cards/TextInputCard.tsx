"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CollapsedCard from "./CollapsedCard";
import type { CardData } from "@/lib/chat/types";

interface TextInputCardProps {
  card: Extract<CardData, { type: "text-input" }>;
  completed: boolean;
  completedSummary?: string;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function TextInputCard({
  card,
  completed,
  completedSummary,
  onComplete,
}: TextInputCardProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!completed) {
      inputRef.current?.focus();
    }
  }, [completed]);

  if (completed) {
    return <CollapsedCard summary={completedSummary} />;
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onComplete(trimmed, `[${card.id}: "${trimmed}"]`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!card.multiline && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (card.multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isEmpty = value.trim().length === 0;

  return (
    <div className="max-w-[600px] w-full space-y-3">
      {/* Question header */}
      <p className="text-sm font-semibold text-foreground font-serif italic">{card.question}</p>

      {/* Hint */}
      {card.hint && (
        <p className="text-xs text-muted-foreground">{card.hint}</p>
      )}

      {/* Input */}
      {card.multiline ? (
        <Textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          rows={4}
          placeholder={card.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "resize-none rounded-xl border-border bg-card text-foreground text-sm focus-visible:ring-primary",
            "min-h-[44px]"
          )}
        />
      ) : (
        <Input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="text"
          placeholder={card.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "rounded-xl border-border bg-card text-foreground text-sm focus-visible:ring-primary",
            "h-11"
          )}
        />
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2">
        {card.multiline && (
          <span className="self-center text-xs text-muted-foreground">
            Cmd+Enter to submit
          </span>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isEmpty}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
