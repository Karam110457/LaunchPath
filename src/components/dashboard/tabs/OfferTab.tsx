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
import { ArrowRight, Shield, Clock, Target } from "lucide-react";
import type { Offer, Recommendation } from "./types";

interface OfferTabProps {
  offer: Offer | null;
  recommendation: Recommendation | null;
  currency: string;
}

export function OfferTab({ offer, recommendation, currency }: OfferTabProps) {
  if (!offer) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No offer has been generated yet. Complete the system building flow
            to see your offer details here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const guaranteeIcon = {
    time_bound: <Clock className="size-4" />,
    outcome_based: <Target className="size-4" />,
    risk_reversal: <Shield className="size-4" />,
  }[offer.guarantee_type ?? "risk_reversal"];

  const guaranteeLabel = {
    time_bound: "Time-bound",
    outcome_based: "Outcome-based",
    risk_reversal: "Risk reversal",
  }[offer.guarantee_type ?? "risk_reversal"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Offer</CardTitle>
        {recommendation?.niche && (
          <CardDescription>Niche: {recommendation.niche}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Transformation */}
        {offer.transformation_from && offer.transformation_to && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Transformation
            </p>
            <div className="grid gap-2">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs font-semibold text-red-400 mb-1">FROM</p>
                <p className="text-sm">{offer.transformation_from}</p>
              </div>
              <div className="flex justify-center">
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-xs font-semibold text-emerald-400 mb-1">
                  TO
                </p>
                <p className="text-sm">{offer.transformation_to}</p>
              </div>
            </div>
          </div>
        )}

        {/* What you deliver */}
        {offer.system_description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              What you deliver
            </p>
            <p className="text-sm">{offer.system_description}</p>
          </div>
        )}

        {/* Guarantee */}
        {offer.guarantee_text && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              {guaranteeIcon}
              <Badge
                variant="secondary"
                className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20"
              >
                {guaranteeLabel}
              </Badge>
            </div>
            <p className="text-sm">{offer.guarantee_text}</p>
          </div>
        )}

        {/* Pricing */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Pricing
          </p>
          <div className="flex gap-3">
            {offer.pricing_setup != null && (
              <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Setup: </span>
                <span className="text-sm font-semibold font-mono">
                  {currency}
                  {offer.pricing_setup.toLocaleString()}
                </span>
              </div>
            )}
            {offer.pricing_monthly != null && (
              <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
                <span className="text-xs text-muted-foreground">
                  Monthly:{" "}
                </span>
                <span className="text-sm font-semibold font-mono">
                  {currency}
                  {offer.pricing_monthly.toLocaleString()}/mo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Revenue projection */}
        {offer.revenue_projection && (
          <div className="flex gap-3">
            <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Target: </span>
              <span className="text-sm font-semibold">
                {offer.revenue_projection.clients_needed} clients
              </span>
            </div>
            <div className="rounded-lg bg-muted border border-border px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Revenue: </span>
              <span className="text-sm font-semibold">
                {offer.revenue_projection.monthly_revenue}/mo
              </span>
            </div>
          </div>
        )}

        {/* Pricing rationale (collapsible) */}
        {offer.pricing_rationale && (
          <Accordion type="single" collapsible>
            <AccordionItem value="rationale" className="border-none">
              <AccordionTrigger className="text-xs text-muted-foreground uppercase tracking-wide py-2 hover:no-underline">
                Pricing rationale
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  {offer.pricing_rationale}
                </p>
                {offer.pricing_comparables &&
                  offer.pricing_comparables.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Comparable services
                      </p>
                      {offer.pricing_comparables.map((comp, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{comp.service}</span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {comp.price_range}
                          </span>
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
  );
}
