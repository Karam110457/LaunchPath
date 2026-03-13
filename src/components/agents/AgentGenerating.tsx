"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, RotateCcw, ArrowLeft, Check } from "lucide-react";

export interface AgentGeneratingProps {
  currentLabel: string | null;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onBack: () => void;
}

// Maps SSE progress labels to display steps
const STEP_TRIGGERS: Array<{ match: string; label: string }> = [
  { match: "website", label: "Analyzing website content" },
  { match: "requirements", label: "Understanding your requirements" },
  { match: "Crafting", label: "Crafting your agent" },
  { match: "Saving", label: "Saving your agent" },
  { match: "integrations", label: "Setting up integrations" },
];

function matchStep(label: string): string | null {
  for (const step of STEP_TRIGGERS) {
    if (label.toLowerCase().includes(step.match.toLowerCase())) {
      return step.label;
    }
  }
  return null;
}

export function AgentGenerating({
  currentLabel,
  error,
  onCancel,
  onRetry,
  onBack,
}: AgentGeneratingProps) {
  // Track completed steps and current active step
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const prevLabelRef = useRef<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer
  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [error]);

  // Map SSE labels to step transitions
  useEffect(() => {
    if (!currentLabel) return;
    const step = matchStep(currentLabel);
    if (!step) return;

    if (step !== prevLabelRef.current) {
      // Previous step is now done
      if (prevLabelRef.current) {
        setCompletedSteps((prev) =>
          prev.includes(prevLabelRef.current!) ? prev : [...prev, prevLabelRef.current!],
        );
      }
      setActiveStep(step);
      prevLabelRef.current = step;
    }
  }, [currentLabel]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-5">
          <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          {error}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back & Edit
          </button>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const allSteps = [...completedSteps, ...(activeStep && !completedSteps.includes(activeStep) ? [activeStep] : [])];
  const elapsedLabel = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto animate-in fade-in duration-300">
      {/* Gradient spinner */}
      <div className="relative h-16 w-16 mb-6">
        <svg className="h-16 w-16 animate-spin" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="gen-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8C00" />
              <stop offset="100%" stopColor="#9D50BB" />
            </linearGradient>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="url(#gen-spinner-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="120 60"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        Building your agent
      </h3>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-8">
        This usually takes 15–30 seconds &middot; {elapsedLabel}
      </p>

      {/* Step checklist */}
      {allSteps.length > 0 && (
        <div className="w-full max-w-xs text-left space-y-2.5 mb-8">
          {allSteps.map((step) => {
            const isDone = completedSteps.includes(step);
            const isActive = step === activeStep && !isDone;

            return (
              <div
                key={step}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
              >
                {isDone ? (
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border-2 border-[#FF8C00] flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-[#FF8C00] animate-pulse" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 shrink-0" />
                )}
                <span
                  className={`text-sm transition-colors ${
                    isDone
                      ? "text-neutral-400 dark:text-neutral-500"
                      : isActive
                        ? "text-neutral-800 dark:text-neutral-200 font-medium"
                        : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
