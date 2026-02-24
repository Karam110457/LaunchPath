"use client";

import { BackgroundGrid } from "@/components/ui/background-grid";
import {
  DemoPageContent,
  type DemoPageContentProps,
} from "@/components/demo/DemoPageContent";

type DemoPageProps = Omit<DemoPageContentProps, "isPreview">;

export function DemoPage(props: DemoPageProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundGrid />
      <div className="relative z-[1]">
        <DemoPageContent {...props} />
      </div>
    </div>
  );
}
