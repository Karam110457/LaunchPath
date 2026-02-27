"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SystemOverviewTab } from "./tabs/SystemOverviewTab";
import { OfferTab } from "./tabs/OfferTab";
import { DemoLeadsTab } from "./tabs/DemoLeadsTab";
import type { Offer, Recommendation, Submission } from "./tabs/types";

interface SystemWorkspaceProps {
  systemId: string;
  systemName: string;
  segment: string;
  isComplete: boolean;
  currentStep: number;
  offer: Offer | null;
  recommendation: Recommendation | null;
  demoUrl: string | null;
  submissions: Submission[];
  totalLeads: number;
  scoreDist: { HIGH: number; MEDIUM: number; LOW: number };
  currency: string;
}

export function SystemWorkspace({
  systemId,
  systemName,
  segment,
  isComplete,
  currentStep,
  offer,
  recommendation,
  demoUrl,
  submissions,
  totalLeads,
  scoreDist,
  currency,
}: SystemWorkspaceProps) {
  return (
    <div className="container py-8 md:py-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl md:text-4xl font-light italic tracking-tight text-foreground">
            {systemName}
          </h1>
          <Badge
            variant="secondary"
            className={
              isComplete
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            }
          >
            {isComplete ? "Live" : "Building"}
          </Badge>
        </div>
        {isComplete && segment && (
          <p className="text-muted-foreground text-sm max-w-2xl">
            {segment}
          </p>
        )}
      </div>

      {/* Tabs */}
      {isComplete ? (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="offer">Offer</TabsTrigger>
            <TabsTrigger value="demo-leads">Demo & Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SystemOverviewTab
              systemId={systemId}
              isComplete={isComplete}
              currentStep={currentStep}
              offer={offer}
              recommendation={recommendation}
              demoUrl={demoUrl}
              submissions={submissions}
              totalLeads={totalLeads}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="offer" className="mt-6">
            <OfferTab
              offer={offer}
              recommendation={recommendation}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="demo-leads" className="mt-6">
            <DemoLeadsTab
              systemId={systemId}
              demoUrl={demoUrl}
              submissions={submissions}
              totalLeads={totalLeads}
              scoreDist={scoreDist}
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* In-progress: just show overview, no tabs needed */
        <SystemOverviewTab
          systemId={systemId}
          isComplete={isComplete}
          currentStep={currentStep}
          offer={offer}
          recommendation={recommendation}
          demoUrl={demoUrl}
          submissions={submissions}
          totalLeads={totalLeads}
          currency={currency}
        />
      )}
    </div>
  );
}
