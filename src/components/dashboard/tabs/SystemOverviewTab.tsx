import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  Pencil,
  Sparkles,
  Zap,
  CheckCircle2,
  Circle,
  Target,
} from "lucide-react";
import { CopyUrlButton } from "@/components/dashboard/CopyUrlButton";
import type { Offer, Recommendation, Submission } from "./types";

// ---------------------------------------------------------------------------
// Smart stage detection — uses actual data, not just currentStep
// ---------------------------------------------------------------------------

interface StageInfo {
  label: string;
  done: boolean;
  active: boolean;
}

function getSmartStages(
  recommendation: Recommendation | null,
  offer: Offer | null
): StageInfo[] {
  const hasNiche = !!recommendation?.niche;
  const hasOffer = !!offer?.system_description;

  return [
    {
      label: "Niche discovery",
      done: hasNiche,
      active: !hasNiche,
    },
    {
      label: "Offer creation",
      done: hasOffer,
      active: hasNiche && !hasOffer,
    },
    {
      label: "Launch",
      done: false,
      active: hasOffer,
    },
  ];
}

function getProgressPercent(
  recommendation: Recommendation | null,
  offer: Offer | null
): number {
  if (offer?.system_description) return 75;
  if (recommendation?.niche) return 40;
  return 10;
}

// ---------------------------------------------------------------------------
// In-progress overview — visual, exciting, beginner-friendly
// ---------------------------------------------------------------------------

function InProgressOverview({
  systemId,
  recommendation,
  offer,
  currency,
}: {
  systemId: string;
  recommendation: Recommendation | null;
  offer: Offer | null;
  currency: string;
}) {
  const stages = getSmartStages(recommendation, offer);
  const progress = getProgressPercent(recommendation, offer);

  return (
    <div className="space-y-6">
      {/* Progress hero */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium">Building your business</span>
            </div>
            <span className="text-sm font-mono text-primary">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stage indicators */}
          <div className="flex gap-6 pt-2">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-2">
                {stage.done ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : stage.active ? (
                  <Circle className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/20" />
                )}
                <span
                  className={`text-xs ${
                    stage.done
                      ? "text-emerald-400"
                      : stage.active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What we know so far */}
      {recommendation && (
        <Card>
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="size-4 text-primary" />
              <span className="text-sm font-medium">Your niche</span>
            </div>
            <p className="text-lg font-serif italic text-foreground leading-snug">
              {recommendation.niche}
            </p>
            {recommendation.your_solution && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.your_solution}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Draft offer preview */}
      {offer?.system_description && (
        <Card>
          <CardContent className="pt-6 pb-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-4 text-amber-400" />
              <span className="text-sm font-medium">Your offer</span>
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                Draft
              </Badge>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {offer.system_description}
            </p>
            {offer.pricing_monthly != null && (
              <p className="text-lg font-mono font-bold text-primary">
                {currency}{offer.pricing_monthly}/mo
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
  demoUrl,
  submissions,
}: {
  systemId: string;
  demoUrl: string | null;
  submissions: Submission[];
}) {
  const recentLeads = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <Card>
        <CardContent className="pt-5 pb-5 flex flex-wrap gap-2">
          {demoUrl && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={demoUrl} target="_blank" rel="noopener noreferrer">
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
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium mb-3">Recent Leads</p>
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
                        New submission
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
  offer,
  recommendation,
  demoUrl,
  submissions,
  currency,
}: SystemOverviewTabProps) {
  if (!isComplete) {
    return (
      <InProgressOverview
        systemId={systemId}
        recommendation={recommendation}
        offer={offer}
        currency={currency}
      />
    );
  }

  return (
    <CompleteOverview
      systemId={systemId}
      demoUrl={demoUrl}
      submissions={submissions}
    />
  );
}
