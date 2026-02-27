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
  ArrowDown,
  Shield,
  DollarSign,
  Globe,
} from "lucide-react";
import { CopyUrlButton } from "@/components/dashboard/CopyUrlButton";
import type { Offer, Recommendation, Submission } from "./types";

// ---------------------------------------------------------------------------
// Smart stage detection
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
    { label: "Niche", done: hasNiche, active: !hasNiche },
    { label: "Offer", done: hasOffer, active: hasNiche && !hasOffer },
    { label: "Launch", done: false, active: hasOffer },
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
// In-progress overview
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
    <div className="space-y-5">
      {/* Progress bar */}
      <Card className="overflow-hidden">
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <span className="text-sm font-mono text-primary">{progress}%</span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-4 pt-1">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                {stage.done ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : stage.active ? (
                  <Circle className="size-3.5 text-primary" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground/20" />
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

      {/* Niche card */}
      {recommendation?.niche && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Niche
              </span>
            </div>
            {recommendation.your_solution && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.your_solution}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offer preview — show transformation if available */}
      {offer && (
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Offer
              </span>
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                Draft
              </Badge>
            </div>

            {/* Transformation FROM → TO */}
            {offer.transformation_from && offer.transformation_to && (
              <div className="space-y-2">
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">From</p>
                  <p className="text-sm text-foreground">{offer.transformation_from}</p>
                </div>
                <div className="flex justify-center">
                  <ArrowDown className="size-4 text-muted-foreground/40" />
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">To</p>
                  <p className="text-sm text-foreground">{offer.transformation_to}</p>
                </div>
              </div>
            )}

            {/* Pricing + Guarantee highlights */}
            <div className="flex flex-wrap gap-3">
              {offer.pricing_monthly != null && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                  <DollarSign className="size-3.5 text-primary" />
                  <span className="text-sm font-semibold font-mono text-primary">
                    {currency}{offer.pricing_monthly}/mo
                  </span>
                </div>
              )}
              {offer.guarantee_text && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                  <Shield className="size-3.5 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    Guarantee included
                  </span>
                </div>
              )}
            </div>
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
  currency,
}: {
  systemId: string;
  offer: Offer | null;
  demoUrl: string | null;
  submissions: Submission[];
  currency: string;
}) {
  const recentLeads = submissions.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Transformation hero */}
      {offer?.transformation_from && offer?.transformation_to && (
        <Card className="overflow-hidden">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="grid gap-2">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Your clients go from</p>
                <p className="text-sm text-foreground">{offer.transformation_from}</p>
              </div>
              <div className="flex justify-center">
                <ArrowDown className="size-4 text-muted-foreground/40" />
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">To</p>
                <p className="text-sm text-foreground">{offer.transformation_to}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key numbers + Demo link */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Pricing */}
        {offer?.pricing_monthly != null && (
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="size-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  You charge
                </span>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">
                {currency}{offer.pricing_monthly.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              {offer.pricing_setup != null && offer.pricing_setup > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  + {currency}{offer.pricing_setup.toLocaleString()} setup
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Demo page */}
        {demoUrl && (
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="size-4 text-emerald-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your demo page
                </span>
                <span className="relative flex size-2 ml-auto">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1.5" />
                    View
                  </a>
                </Button>
                <CopyUrlButton url={demoUrl} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/systems/${systemId}/builder`}>
                    <Pencil className="size-3.5 mr-1.5" />
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Guarantee highlight */}
      {offer?.guarantee_text && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="size-4 text-amber-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your guarantee
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {offer.guarantee_text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent leads */}
      {recentLeads.length > 0 && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Recent Leads
            </p>
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
      offer={offer}
      demoUrl={demoUrl}
      submissions={submissions}
      currency={currency}
    />
  );
}
