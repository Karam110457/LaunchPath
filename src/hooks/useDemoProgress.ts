"use client";

import { useState, useCallback, useRef } from "react";
import type { DemoConfig } from "@/lib/ai/schemas";

interface DemoProgress {
  /** Whether the demo generation is currently in progress */
  isLoading: boolean;
  /** Completed step IDs for progress display */
  completedSteps: string[];
  /** Human-readable label for the current step being processed */
  currentLabel: string | null;
  /** The generated demo config (null until complete) */
  demoConfig: DemoConfig | null;
  /** The demo URL (null until complete) */
  demoUrl: string | null;
  /** Error message if generation failed */
  error: string | null;
  /** Start the demo generation stream */
  startGeneration: (systemId: string) => void;
}

/**
 * React hook for consuming the demo builder workflow stream.
 * Provides real-time progress updates as the demo page is generated.
 *
 * Usage:
 * ```tsx
 * const { isLoading, currentLabel, demoConfig, demoUrl, error, startGeneration } = useDemoProgress();
 * useEffect(() => { startGeneration(systemId); }, [systemId]);
 * ```
 */
export function useDemoProgress(): DemoProgress {
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [demoConfig, setDemoConfig] = useState<DemoConfig | null>(null);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback((systemId: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setCompletedSteps([]);
    setCurrentLabel("Building your system...");
    setDemoConfig(null);
    setDemoUrl(null);
    setError(null);

    fetch(`/api/systems/${systemId}/demo`, {
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
                setCurrentLabel(event.label ?? null);
              } else if (event.type === "step-complete") {
                if (event.stepId) {
                  setCompletedSteps((prev) =>
                    prev.includes(event.stepId) ? prev : [...prev, event.stepId]
                  );
                }
                setCurrentLabel(null);
              } else if (event.type === "complete") {
                setDemoConfig(event.demo_config);
                setDemoUrl(event.demo_url);
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
    demoConfig,
    demoUrl,
    error,
    startGeneration,
  };
}
