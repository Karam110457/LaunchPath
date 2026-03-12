"use client";

import { Loader2, AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";

interface AgentGeneratingProps {
  currentLabel: string | null;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export function AgentGenerating({
  currentLabel,
  error,
  onCancel,
  onRetry,
  onBack,
}: AgentGeneratingProps) {
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

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FF8C00]/10 to-[#9D50BB]/10 flex items-center justify-center mb-5">
        <Loader2 className="h-6 w-6 animate-spin text-[#FF8C00]" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Building your agent...
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        {currentLabel ?? "Starting..."}
      </p>
      <button
        onClick={onCancel}
        className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
