"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CardData } from "@/lib/chat/types";

interface OfferSummaryCardProps {
  card: Extract<CardData, { type: "offer-summary" }>;
  onComplete: (displayText: string, structuredMessage: string) => void;
}

export default function OfferSummaryCard({ card, onComplete }: OfferSummaryCardProps) {
  const { offer } = card;

  function handleBuild() {
    onComplete("Build my system", "[build-system: confirmed]");
  }

  return (
    <div className="max-w-[600px] w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 px-5 py-4">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          Your Complete Offer
        </p>
        <h3 className="text-base font-bold text-white leading-snug font-serif italic">
          {offer.segment}
        </h3>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Transformation */}
        <div>
          <SectionLabel>Transformation</SectionLabel>
          <div className="flex items-start gap-2 mt-1.5">
            <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs font-semibold text-red-400 mb-0.5">From</p>
              <p className="text-sm text-red-300 leading-snug">{offer.transformation_from}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-3" />
            <div className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-400 mb-0.5">To</p>
              <p className="text-sm text-emerald-300 leading-snug">{offer.transformation_to}</p>
            </div>
          </div>
        </div>

        {/* System */}
        <div>
          <SectionLabel>What you deliver</SectionLabel>
          <p className="text-sm text-foreground leading-relaxed mt-1.5">
            {offer.system_description}
          </p>
        </div>

        {/* Pricing */}
        <div>
          <SectionLabel>Pricing</SectionLabel>
          <div className="flex gap-3 mt-1.5">
            <PriceChip label="Setup fee" value={`£${offer.pricing_setup.toLocaleString()}`} />
            <PriceChip label="Monthly" value={`£${offer.pricing_monthly.toLocaleString()}/mo`} />
          </div>
        </div>

        {/* Guarantee */}
        <div>
          <SectionLabel>Guarantee</SectionLabel>
          <div className="mt-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <p className="text-sm text-amber-300">
              {offer.guarantee_text || "No guarantee set"}
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleBuild}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-base mt-2"
        >
          Build My System →
        </Button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </p>
  );
}

function PriceChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted border border-border px-3 py-2 text-center flex-1">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
