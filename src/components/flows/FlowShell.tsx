"use client";

import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface FlowShellProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  showProgress?: boolean;
  className?: string;
}

export function FlowShell({
  children,
  currentStep,
  totalSteps,
  showProgress = true,
  className,
}: FlowShellProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between h-14 px-6 max-w-2xl mx-auto w-full">
          <Logo className="text-lg" />
          {showProgress && (
            <span className="text-sm text-muted-foreground">
              {currentStep} of {totalSteps}
            </span>
          )}
        </div>
        {showProgress && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
