"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgencyAnalyticsDashboard } from "@/components/analytics/AgencyAnalyticsDashboard";

type Tab = "overview" | "analytics";

interface ClientCardData {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
  campaign_count: number;
}

interface ClientsPageTabsProps {
  children: React.ReactNode;
  defaultTab?: Tab;
}

const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "All Clients" },
  { key: "analytics", label: "Analytics" },
];

export function ClientsPageTabs({ children, defaultTab = "overview" }: ClientsPageTabsProps) {
  const [active, setActive] = useState<Tab>(defaultTab);

  return (
    <>
      {/* Tab pills */}
      <nav className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-150",
              active === tab.key
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {active === "overview" ? (
        <div className="animate-in fade-in duration-200">{children}</div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <AgencyAnalyticsDashboard />
        </div>
      )}
    </>
  );
}
