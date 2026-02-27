import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  ExternalLink,
  Pencil,
  Shield,
  Clock,
  Target,
} from "lucide-react";
import { getTargetCurrencySymbol } from "@/lib/utils/currency";
import { CopyUrlButton } from "./CopyUrlButton";

// ---------------------------------------------------------------------------
// Types for JSON fields
// ---------------------------------------------------------------------------

interface Offer {
  segment?: string;
  system_description?: string;
  transformation_from?: string;
  transformation_to?: string;
  pitch_from?: string;
  pitch_to?: string;
  guarantee_text?: string;
  guarantee_type?: "time_bound" | "outcome_based" | "risk_reversal";
  guarantee_confidence?: string;
  pricing_setup?: number;
  pricing_monthly?: number;
  pricing_rationale?: string;
  pricing_comparables?: Array<{ service: string; price_range: string }>;
  revenue_projection?: { clients_needed: number; monthly_revenue: string };
  delivery_model?: string;
}

interface Recommendation {
  niche?: string;
  score?: number;
  bottleneck?: string;
  your_solution?: string;
  target_segment?: { description?: string };
  strategic_insight?: string;
}

interface Submission {
  result: { priority?: string } | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: system }, { data: submissions }, { data: userProfile }] =
    await Promise.all([
      supabase
        .from("user_systems")
        .select("*")
        .eq("id", systemId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("demo_submissions")
        .select("result, created_at")
        .eq("system_id", systemId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_profiles")
        .select("location_country")
        .eq("id", user.id)
        .single(),
    ]);

  if (!system) notFound();

  const offer = system.offer as Offer | null;
  const recommendation = system.chosen_recommendation as Recommendation | null;
  const currency = getTargetCurrencySymbol(
    userProfile?.location_country ?? null,
    system.location_target,
  );
  const isComplete = system.status === "complete";

  // Score distribution from submissions
  const scoreDist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  (submissions ?? []).forEach((s: Submission) => {
    const priority = (s.result as { priority?: string } | null)?.priority;
    if (priority && priority in scoreDist) {
      scoreDist[priority as keyof typeof scoreDist]++;
    }
  });
  const totalLeads = (submissions ?? []).length;

  // ── In-progress system ─────────────────────────────────────────────────────
  if (!isComplete) {
    return (
      <PageShell
        title={offer?.system_description ?? recommendation?.niche ?? "System in progress"}
        description={offer?.segment ?? "This system is still being built."}
      >
        <div className="grid gap-6 max-w-2xl">
          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chosen Niche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{recommendation.niche}</p>
                {recommendation.bottleneck && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bottleneck</p>
                    <p className="text-sm">{recommendation.bottleneck}</p>
                  </div>
                )}
                {recommendation.your_solution && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Solution</p>
                    <p className="text-sm">{recommendation.your_solution}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                    {currency}{offer.pricing_monthly}/mo
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Button asChild size="lg" className="w-full">
            <Link href={`/start/${system.id}`}>
              Continue Building
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  // ── Complete system ────────────────────────────────────────────────────────

  const guaranteeIcon = {
    time_bound: <Clock className="size-4" />,
    outcome_based: <Target className="size-4" />,
    risk_reversal: <Shield className="size-4" />,
  }[offer?.guarantee_type ?? "risk_reversal"];

  const guaranteeLabel = {
    time_bound: "Time-bound",
    outcome_based: "Outcome-based",
    risk_reversal: "Risk reversal",
  }[offer?.guarantee_type ?? "risk_reversal"];

  return (
    <PageShell
      title={offer?.system_description ?? "Your Business"}
      description={offer?.segment ?? ""}
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/start/${system.id}`}>
              View Chat
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 max-w-3xl">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-400 tracking-wide">LIVE</span>
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
                {currency}{offer?.pricing_monthly?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Monthly</p>
            </CardContent>
          </Card>
        </div>

        {/* Offer section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Offer</CardTitle>
            {recommendation?.niche && (
              <CardDescription>Niche: {recommendation.niche}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Transformation */}
            {offer?.transformation_from && offer?.transformation_to && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Transformation</p>
                <div className="grid gap-2">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs font-semibold text-red-400 mb-1">FROM</p>
                    <p className="text-sm">{offer.transformation_from}</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-xs font-semibold text-emerald-400 mb-1">TO</p>
                    <p className="text-sm">{offer.transformation_to}</p>
                  </div>
                </div>
              </div>
            )}

            {/* What you deliver */}
            {offer?.system_description && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">What you deliver</p>
                <p className="text-sm">{offer.system_description}</p>
              </div>
            )}

            {/* Guarantee */}
            {offer?.guarantee_text && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  {guaranteeIcon}
                  <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                    {guaranteeLabel}
                  </Badge>
                </div>
                <p className="text-sm">{offer.guarantee_text}</p>
              </div>
            )}

            {/* Pricing */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Pricing</p>
              <div className="flex gap-3">
                {offer?.pricing_setup != null && (
                  <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Setup: </span>
                    <span className="text-sm font-semibold font-mono">{currency}{offer.pricing_setup.toLocaleString()}</span>
                  </div>
                )}
                {offer?.pricing_monthly != null && (
                  <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Monthly: </span>
                    <span className="text-sm font-semibold font-mono">{currency}{offer.pricing_monthly.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue projection */}
            {offer?.revenue_projection && (
              <div className="flex gap-3">
                <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Target: </span>
                  <span className="text-sm font-semibold">{offer.revenue_projection.clients_needed} clients</span>
                </div>
                <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Revenue: </span>
                  <span className="text-sm font-semibold">{offer.revenue_projection.monthly_revenue}/mo</span>
                </div>
              </div>
            )}

            {/* Pricing rationale (collapsible) */}
            {offer?.pricing_rationale && (
              <Accordion type="single" collapsible>
                <AccordionItem value="rationale" className="border-none">
                  <AccordionTrigger className="text-xs text-muted-foreground uppercase tracking-wide py-2 hover:no-underline">
                    Pricing rationale
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{offer.pricing_rationale}</p>
                    {offer.pricing_comparables && offer.pricing_comparables.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Comparable services</p>
                        {offer.pricing_comparables.map((comp, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{comp.service}</span>
                            <span className="text-muted-foreground font-mono text-xs">{comp.price_range}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Demo section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demo Page</CardTitle>
            <CardDescription>Your AI-powered lead qualification page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo URL */}
            {system.demo_url && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                <a
                  href={system.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-1.5 min-w-0 group"
                >
                  <ExternalLink className="size-3.5 shrink-0 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-primary truncate hover:underline">
                    {system.demo_url}
                  </span>
                </a>
                <CopyUrlButton url={system.demo_url} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {system.demo_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={system.demo_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1.5" />
                    View Demo
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/builder/${system.id}`}>
                  <Pencil className="size-3.5 mr-1.5" />
                  Edit in Builder
                </Link>
              </Button>
            </div>

            {/* Lead stats */}
            {totalLeads > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Lead Quality</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    High: {scoreDist.HIGH}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                    Medium: {scoreDist.MEDIUM}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                    Low: {scoreDist.LOW}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[
                "Try your own demo page — go through the flow as a prospect would.",
                "Share it with a prospect — send the link and see how they respond.",
                "Check your dashboard for submissions — track qualified leads as they come in.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-snug">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
