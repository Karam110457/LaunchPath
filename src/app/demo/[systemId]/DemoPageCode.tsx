"use client";

/**
 * Code-based demo page renderer.
 * Uses the JSX renderer to dynamically render agent-generated page code.
 * Falls back to an error message if code is invalid.
 */

import { useMemo } from "react";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { CodeErrorBoundary } from "@/components/builder/CodeErrorBoundary";
import { renderJSX } from "@/lib/builder/jsx-renderer";
import { buildFullScope } from "@/lib/builder/scope-components";
import { getDemoThemeVars } from "@/lib/demo-theme";
import type { DemoConfig } from "@/lib/ai/schemas";
import { AlertTriangle } from "lucide-react";

interface DemoPageCodeProps {
  systemId: string;
  demoConfig: DemoConfig;
  pageCode: string;
}

export function DemoPageCode({
  systemId,
  demoConfig,
  pageCode,
}: DemoPageCodeProps) {
  const scope = useMemo(
    () =>
      buildFullScope({
        systemId,
        demoConfig,
        isPreview: false,
      }),
    [systemId, demoConfig]
  );

  const { element, error } = useMemo(
    () => renderJSX(pageCode, scope),
    [pageCode, scope]
  );

  return (
    <div
      className="min-h-screen bg-background relative"
      style={getDemoThemeVars(demoConfig.theme)}
    >
      <BackgroundGrid />
      <div className="relative z-[1]">
        <CodeErrorBoundary>
          {error ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
              <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 mb-4">
                <AlertTriangle className="size-6 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Page Error
              </h3>
              <p className="text-xs text-muted-foreground max-w-md font-mono">
                {error}
              </p>
            </div>
          ) : (
            element
          )}
        </CodeErrorBoundary>
      </div>
    </div>
  );
}
