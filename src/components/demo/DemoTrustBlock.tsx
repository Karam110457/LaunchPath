"use client";

import { Shield } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

interface DemoTrustBlockProps {
  showGuarantee: boolean;
  guaranteeText?: string;
  segment: string;
}

export function DemoTrustBlock({
  showGuarantee,
  guaranteeText,
  segment,
}: DemoTrustBlockProps) {
  if (!showGuarantee || !guaranteeText) return null;

  return (
    <ScrollReveal className="max-w-2xl mx-auto px-4 space-y-4">
      {/* Guarantee — prominent card */}
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

      {/* Social proof placeholder */}
      <p className="text-xs text-center text-muted-foreground tracking-wide">
        Built for {segment} businesses
      </p>
    </ScrollReveal>
  );
}
