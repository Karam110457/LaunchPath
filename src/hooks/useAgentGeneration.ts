"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentGenerationOutput } from "@/lib/ai/schemas";
import type { WizardGenerationPayload } from "@/types/agent-wizard";

type GeneratedAgent = AgentGenerationOutput & { id: string };

interface GenerationInput {
  prompt?: string;
  templateId?: string;
  systemId?: string;
  wizardConfig?: WizardGenerationPayload;
}

interface AgentGenerationState {
  isLoading: boolean;
  currentLabel: string | null;
  agent: GeneratedAgent | null;
  error: string | null;
  startGeneration: (input: GenerationInput) => void;
  /** Abort the in-flight generation and return to pre-generation state */
  cancel: () => void;
  /** Clear error/agent/loading state — used to go back to the wizard after an error */
  reset: () => void;
}

export function useAgentGeneration(): AgentGenerationState {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [agent, setAgent] = useState<GeneratedAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setCurrentLabel(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setCurrentLabel(null);
    setAgent(null);
    setError(null);
  }, []);

  const startGeneration = useCallback(
    (input: GenerationInput) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setCurrentLabel("Starting...");
      setAgent(null);
      setError(null);

      fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
              (data as { error?: string }).error || `HTTP ${response.status}`,
            );
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";

          // eslint-disable-next-line no-constant-condition
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
                const event = JSON.parse(dataLine.slice(6)) as {
                  type: string;
                  label?: string;
                  agent?: GeneratedAgent;
                  error?: string;
                };

                if (event.type === "progress") {
                  setCurrentLabel(event.label ?? null);
                } else if (event.type === "complete" && event.agent) {
                  setAgent(event.agent);
                  setCurrentLabel(null);
                  setIsLoading(false);
                } else if (event.type === "error") {
                  setError(event.error ?? "Generation failed");
                  setCurrentLabel(null);
                  setIsLoading(false);
                }
              } catch {
                // Ignore malformed SSE events
              }
            }
          }

          // If stream ended without a complete/error event, stop loading
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(
            err instanceof Error ? err.message : "Unknown error",
          );
          setCurrentLabel(null);
          setIsLoading(false);
        });
    },
    [],
  );

  return { isLoading, currentLabel, agent, error, startGeneration, cancel, reset };
}
