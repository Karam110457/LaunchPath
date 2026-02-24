"use client";

import { DemoPageContent } from "@/components/demo/DemoPageContent";
import type { DemoConfig } from "@/lib/ai/schemas";

interface BuilderPreviewProps {
  systemId: string;
  demoConfig: DemoConfig;
  segment: string;
  transformationFrom?: string;
  transformationTo?: string;
  businessName: string;
  solution: string;
}

export function BuilderPreview({
  systemId,
  demoConfig,
  segment,
  transformationFrom,
  transformationTo,
  businessName,
  solution,
}: BuilderPreviewProps) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <DemoPageContent
        systemId={systemId}
        demoConfig={demoConfig}
        businessName={businessName}
        solution={solution}
        segment={segment}
        transformationFrom={transformationFrom}
        transformationTo={transformationTo}
        isPreview
      />
    </div>
  );
}
