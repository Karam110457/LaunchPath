"use client";

import { Shield } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface DemoTrustBlockProps {
  showGuarantee: boolean;
  guaranteeText?: string;
  showPricing: boolean;
  pricingText?: string;
  segment: string;
}

export function DemoTrustBlock({
  showGuarantee,
  guaranteeText,
  showPricing,
  pricingText,
  segment,
}: DemoTrustBlockProps) {
  const hasContent =
    (showGuarantee && guaranteeText) || (showPricing && pricingText);

  if (!hasContent) return null;

  return (
    <ScrollReveal className="max-w-2xl mx-auto px-4 space-y-4">
      {/* Guarantee — prominent card */}
      {showGuarantee && guaranteeText && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/15 shrink-0">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">
                Our Guarantee
              </p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                {guaranteeText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing — anchored display */}
      {showPricing && pricingText && (
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 text-center">
          <p className="text-sm text-foreground/80">{pricingText}</p>
        </div>
      )}

      {/* Social proof placeholder */}
      <p className="text-xs text-center text-muted-foreground tracking-wide">
        Built for {segment} businesses
      </p>
    </ScrollReveal>
  );
}
