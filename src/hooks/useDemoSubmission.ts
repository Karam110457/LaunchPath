"use client";

import { useState, useCallback, useRef } from "react";
import type { DemoResult } from "@/lib/ai/schemas";
import type { AnalysisStep } from "@/components/demo/AnalysisProgress";

const INITIAL_STEPS: AnalysisStep[] = [
  { id: "reading", label: "Reading your data", status: "pending" },
  { id: "scoring", label: "Scoring your fit", status: "pending" },
  { id: "insights", label: "Generating insights", status: "pending" },
  { id: "report", label: "Preparing your report", status: "pending" },
];

interface DemoSubmission {
  isSubmitting: boolean;
  analysisSteps: AnalysisStep[];
  result: DemoResult | null;
  error: string | null;
  submit: (systemId: string, formData: Record<string, string>) => void;
  reset: () => void;
}

export function useDemoSubmission(): DemoSubmission {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisSteps, setAnalysisSteps] =
    useState<AnalysisStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function updateStepStatus(
    stepId: string,
    status: AnalysisStep["status"]
  ) {
    setAnalysisSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
  }

  const submit = useCallback(
    (systemId: string, formData: Record<string, string>) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsSubmitting(true);
      setAnalysisSteps(
        INITIAL_STEPS.map((s) => ({ ...s, status: "pending" }))
      );
      setResult(null);
      setError(null);

      fetch(`/api/demo/${systemId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_data: formData }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${response.status}`);
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

                if (event.type === "step-active") {
                  updateStepStatus(event.stepId, "active");
                } else if (event.type === "step-done") {
                  updateStepStatus(event.stepId, "done");
                } else if (event.type === "complete") {
                  // Mark all remaining steps done
                  setAnalysisSteps((prev) =>
                    prev.map((s) => ({ ...s, status: "done" as const }))
                  );
                  setResult(event.result);
                  setIsSubmitting(false);
                } else if (event.type === "error") {
                  setError(event.error);
                  setIsSubmitting(false);
                }
              } catch {
                // Ignore malformed SSE events
              }
            }
          }

          setIsSubmitting(false);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof Error ? err.message : "Unknown error");
          setIsSubmitting(false);
        });
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsSubmitting(false);
    setAnalysisSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));
    setResult(null);
    setError(null);
  }, []);

  return { isSubmitting, analysisSteps, result, error, submit, reset };
}
