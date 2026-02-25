/**
 * Config-to-code bridge: converts a DemoConfig into initial JSX+Tailwind code.
 * This produces the starting code that matches the current visual output of
 * the config-driven demo page, giving the builder agent a baseline to work from.
 */

import type { DemoConfig } from "@/lib/ai/schemas";

interface ConfigToCodeContext {
  segment: string;
  transformationFrom?: string;
  transformationTo?: string;
}

/**
 * Generate JSX code from a DemoConfig.
 * The output defines a `function DemoPage()` that uses scope components.
 */
export function configToCode(
  config: DemoConfig,
  context: ConfigToCodeContext
): string {
  const headlineStyle = config.theme?.headline_style ?? "serif-italic";
  const headlineClass =
    headlineStyle === "sans-bold"
      ? "font-sans font-bold"
      : "font-serif font-light italic";
  const subHeadlineClass =
    headlineStyle === "sans-bold"
      ? "font-sans font-bold"
      : "font-serif font-light italic";

  const benefitsCode = buildBenefitsSection(config);
  const trustCode = buildTrustSection(config, context.segment);
  const transformationCode = buildTransformationSection(
    context.transformationFrom,
    context.transformationTo,
    config.transformation_headline
  );

  return `function DemoPage() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <div className="relative text-center pt-20 sm:pt-28 pb-8 px-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 35%, color-mix(in oklch, var(--primary) 7%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide">
            <Icons.Sparkles className="h-3.5 w-3.5" />
            ${escapeJsx(config.agent_name)}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] ${headlineClass}">
            ${escapeJsx(config.hero_headline)}
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 max-w-xl mx-auto leading-relaxed">
            ${escapeJsx(config.hero_subheadline)}
          </p>

${transformationCode}
        </div>
      </div>

${benefitsCode}

${trustCode}

      {/* Interactive Demo — Form, Analysis Progress, and Results */}
      <InteractiveDemo />

      <DemoFooter />
    </div>
  );
}`;
}

// ─── Section Builders ──────────────────────────────────────────────────

function buildBenefitsSection(config: DemoConfig): string {
  const benefits = config.benefits;
  if (!benefits || benefits.length === 0) return "";

  const iconMap: Record<string, string> = {
    chart: "BarChart3",
    clock: "Clock",
    target: "Target",
    shield: "Shield",
    zap: "Zap",
    users: "Users",
  };

  const cards = benefits
    .map((b) => {
      const iconName = iconMap[b.icon] ?? "Zap";
      return `          <div className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 space-y-3 text-center transition-colors duration-300 hover:border-primary/20 hover:bg-card/60">
            <div className="inline-flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <Icons.${iconName} className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">${escapeJsx(b.title)}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">${escapeJsx(b.description)}</p>
          </div>`;
    })
    .join("\n");

  return `      {/* Value Propositions */}
      <ScrollReveal className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
${cards}
        </div>
      </ScrollReveal>`;
}

function buildTrustSection(config: DemoConfig, segment: string): string {
  const hasGuarantee = config.show_guarantee && config.guarantee_text;
  const hasPricing = config.show_pricing && config.pricing_text;
  if (!hasGuarantee && !hasPricing) return "";

  let inner = "";

  if (hasGuarantee) {
    inner += `        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/15 shrink-0">
              <Icons.Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Our Guarantee</p>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">${escapeJsx(config.guarantee_text!)}</p>
            </div>
          </div>
        </div>\n`;
  }

  if (hasPricing) {
    inner += `        <div className="rounded-xl border border-border/40 bg-card/40 p-4 text-center">
          <p className="text-sm text-foreground/80">${escapeJsx(config.pricing_text!)}</p>
        </div>\n`;
  }

  inner += `        <p className="text-xs text-center text-muted-foreground tracking-wide">
          Built for ${escapeJsx(segment)} businesses
        </p>`;

  return `      {/* Trust & Social Proof */}
      <ScrollReveal className="max-w-2xl mx-auto px-4 space-y-4">
${inner}
      </ScrollReveal>`;
}

function buildTransformationSection(
  from?: string,
  to?: string,
  fallback?: string
): string {
  if (from && to) {
    return `          <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
            <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-2.5 max-w-[260px]">
              <p className="text-xs font-bold text-red-400/80 uppercase tracking-wider mb-0.5">From</p>
              <p className="text-sm text-red-300/90 leading-snug">${escapeJsx(from)}</p>
            </div>
            <Icons.ArrowRight className="size-4 text-muted-foreground/50 shrink-0" />
            <div className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-2.5 max-w-[260px]">
              <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-0.5">To</p>
              <p className="text-sm text-primary/90 leading-snug">${escapeJsx(to)}</p>
            </div>
          </div>`;
  }

  if (fallback) {
    return `          <p className="text-base font-medium text-primary/70 italic">${escapeJsx(fallback)}</p>`;
  }

  return "";
}

// ─── Utility ───────────────────────────────────────────────────────────

function escapeJsx(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/`/g, "\\`")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
