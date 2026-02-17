"use client";

import { useState, useCallback, useRef } from "react";
import type { AssembledOffer } from "@/lib/ai/schemas";

interface OfferProgress {
  /** Whether the offer generation is currently in progress */
  isLoading: boolean;
  /** Completed step IDs for progress display */
  completedSteps: string[];
  /** Human-readable label for the current step being processed */
  currentLabel: string | null;
  /** The final assembled offer (null until complete) */
  offer: AssembledOffer | null;
  /** Error message if generation failed */
  error: string | null;
  /** Start the offer generation stream */
  startGeneration: (systemId: string) => void;
}

/**
 * React hook for consuming the offer workflow stream.
 * Provides real-time progress updates via Mastra's workflow streaming events.
 *
 * Handles three event types from the SSE endpoint:
 *   progress    — a step is actively running (show animated label)
 *   step-complete — a step finished (mark done)
 *   complete    — workflow finished (set offer)
 *   error       — something went wrong
 *
 * Usage:
 * ```tsx
 * const { isLoading, currentLabel, completedSteps, offer, error, startGeneration } = useOfferProgress();
 * useEffect(() => { startGeneration(systemId); }, [systemId]);
 * ```
 */
export function useOfferProgress(): OfferProgress {
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [offer, setOffer] = useState<AssembledOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback((systemId: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setCompletedSteps([]);
    setCurrentLabel("Starting...");
    setOffer(null);
    setError(null);

    fetch(`/api/systems/${systemId}/offer`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (double newline delimited)
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";

          for (const message of messages) {
            const dataLine = message
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            try {
              const event = JSON.parse(dataLine.slice(6));

              if (event.type === "progress") {
                // A step is actively running — show its label
                setCurrentLabel(event.label ?? null);
              } else if (event.type === "step-complete") {
                // A step finished — mark it done
                if (event.stepId) {
                  setCompletedSteps((prev) =>
                    prev.includes(event.stepId) ? prev : [...prev, event.stepId]
                  );
                }
                setCurrentLabel(null);
              } else if (event.type === "complete") {
                setOffer(event.offer);
                setCurrentLabel(null);
                setIsLoading(false);
              } else if (event.type === "error") {
                setError(event.error);
                setCurrentLabel(null);
                setIsLoading(false);
              }
            } catch {
              // Ignore malformed SSE events
            }
          }
        }

        setIsLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setCurrentLabel(null);
        setIsLoading(false);
      });
  }, []);

  return {
    isLoading,
    completedSteps,
    currentLabel,
    offer,
    error,
    startGeneration,
  };
}
