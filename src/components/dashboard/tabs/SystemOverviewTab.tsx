import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { CopyUrlButton } from "@/components/dashboard/CopyUrlButton";
import type { Offer, Recommendation, Submission } from "./types";

// ---------------------------------------------------------------------------
// Stage helpers
// ---------------------------------------------------------------------------

const STAGES = [
  { maxStep: 2, label: "Gathering info" },
  { maxStep: 3, label: "Analyzing niches" },
  { maxStep: 4, label: "Choosing niche" },
  { maxStep: 6, label: "Building offer" },
  { maxStep: 8, label: "Generating system" },
  { maxStep: Infinity, label: "Finishing up" },
];

function getCurrentStageIndex(step: number) {
  return STAGES.findIndex((s) => step <= s.maxStep);
}

// ---------------------------------------------------------------------------
// In-progress overview
// ---------------------------------------------------------------------------

function InProgressOverview({
  systemId,
  currentStep,
  recommendation,
  offer,
  currency,
}: {
  systemId: string;
  currentStep: number;
  recommendation: Recommendation | null;
  offer: Offer | null;
  currency: string;
}) {
  const stageIdx = getCurrentStageIndex(currentStep);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STAGES.map((stage, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle
                    className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground/30"}`}
                  />
                )}
                <span
                  className={`text-sm ${active ? "text-foreground font-medium" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                >
                  {stage.label}
                </span>
                {active && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Current
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Niche info */}
      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chosen Niche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{recommendation.niche}</p>
            {recommendation.bottleneck && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Bottleneck
                </p>
                <p className="text-sm">{recommendation.bottleneck}</p>
              </div>
            )}
            {recommendation.your_solution && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Your Solution
                </p>
                <p className="text-sm">{recommendation.your_solution}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draft offer */}
      {offer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offer (Draft)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {offer.system_description && (
              <p className="text-sm">{offer.system_description}</p>
            )}
            {offer.pricing_monthly != null && (
              <p className="text-sm text-muted-foreground">
                {currency}
                {offer.pricing_monthly}/mo
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Continue CTA */}
      <Button asChild size="lg" className="w-full">
        <Link href={`/dashboard/systems/${systemId}/chat`}>
          Continue Building
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete overview
// ---------------------------------------------------------------------------

function CompleteOverview({
  systemId,
  offer,
  demoUrl,
  submissions,
  totalLeads,
  currency,
}: {
  systemId: string;
  offer: Offer | null;
  demoUrl: string | null;
  submissions: Submission[];
  totalLeads: number;
  currency: string;
}) {
  const recentLeads = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-400 tracking-wide">
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Demo Page</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 space-y-1">
            <p className="text-xl font-bold tabular-nums">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3 space-y-1">
            <p className="text-xl font-bold tabular-nums">
              {currency}
              {offer?.pricing_monthly?.toLocaleString() ?? "\u2014"}
            </p>
            <p className="text-xs text-muted-foreground">Monthly</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {demoUrl && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5 mr-1.5" />
                  View Demo
                </a>
              </Button>
              <CopyUrlButton url={demoUrl} />
            </>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/builder/${systemId}`}>
              <Pencil className="size-3.5 mr-1.5" />
              Edit Demo
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent leads */}
      {recentLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentLeads.map((sub, i) => {
                const priority = (sub.result as { priority?: string } | null)
                  ?.priority;
                const date = new Date(sub.created_at);
                const relative = getRelativeTime(date);

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {priority && (
                        <Badge
                          variant="secondary"
                          className={priorityClass(priority)}
                        >
                          {priority}
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        Lead submission
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {relative}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "LOW":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "";
  }
}

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

interface SystemOverviewTabProps {
  systemId: string;
  isComplete: boolean;
  currentStep: number;
  offer: Offer | null;
  recommendation: Recommendation | null;
  demoUrl: string | null;
  submissions: Submission[];
  totalLeads: number;
  currency: string;
}

export function SystemOverviewTab({
  systemId,
  isComplete,
  currentStep,
  offer,
  recommendation,
  demoUrl,
  submissions,
  totalLeads,
  currency,
}: SystemOverviewTabProps) {
  if (!isComplete) {
    return (
      <InProgressOverview
        systemId={systemId}
        currentStep={currentStep}
        recommendation={recommendation}
        offer={offer}
        currency={currency}
      />
    );
  }

  return (
    <CompleteOverview
      systemId={systemId}
      offer={offer}
      demoUrl={demoUrl}
      submissions={submissions}
      totalLeads={totalLeads}
      currency={currency}
    />
  );
}
