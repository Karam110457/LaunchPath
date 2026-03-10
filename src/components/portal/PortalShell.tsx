"use client";

import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { PortalTopNav } from "./PortalTopNav";

interface PortalShellProps {
  children: React.ReactNode;
  previewMode?: boolean;
}

export function PortalShell({ children, previewMode }: PortalShellProps) {
  return (
    <div className={`min-h-screen bg-background flex flex-col antialiased relative overflow-hidden ${previewMode ? "pt-10" : ""}`}>
      <GlobalBackground />
      <div className="relative z-10 flex flex-col flex-1 h-full">
        <PortalTopNav />
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
