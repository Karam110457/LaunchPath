"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { DemoConfig } from "@/lib/ai/schemas";
import { getDemoThemeVars } from "@/lib/demo-theme";
import { renderJSX } from "@/lib/builder/jsx-renderer";
import { buildFullScope } from "@/lib/builder/scope-components";
import { CodeErrorBoundary } from "@/components/builder/CodeErrorBoundary";

interface BuilderPreviewProps {
  systemId: string;
  demoConfig: DemoConfig;
  code: string;
}

export function BuilderPreview({
  systemId,
  demoConfig,
  code,
}: BuilderPreviewProps) {
  const scope = useMemo(
    () =>
      buildFullScope({
        systemId,
        demoConfig,
        isPreview: true,
      }),
    [systemId, demoConfig]
  );

  const { element, error } = useMemo(
    () => renderJSX(code, scope),
    [code, scope]
  );

  return (
    <div
      className="h-full overflow-y-auto bg-background"
      style={getDemoThemeVars(demoConfig.theme)}
    >
      <CodeErrorBoundary>
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="size-6 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Preview Error
            </h3>
            <p className="text-xs text-muted-foreground max-w-md font-mono break-all">
              {error}
            </p>
          </div>
        ) : (
          element
        )}
      </CodeErrorBoundary>
    </div>
  );
}
