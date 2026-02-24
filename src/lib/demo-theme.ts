/**
 * Per-niche theme color mapping for demo pages.
 * Returns CSS custom properties that override --primary (accent) and add --demo-cta.
 * Used by DemoPage and BuilderPreview to scope theme to the demo page subtree.
 */

import type { DemoTheme } from "@/lib/ai/schemas";

const ACCENT_MAP: Record<NonNullable<DemoTheme["accent_color"]>, string> = {
  emerald: "oklch(0.60 0.16 165)",
  blue: "oklch(0.55 0.16 250)",
  violet: "oklch(0.55 0.16 290)",
  amber: "oklch(0.70 0.16 80)",
  rose: "oklch(0.60 0.16 15)",
  cyan: "oklch(0.65 0.14 200)",
};

const CTA_MAP: Record<NonNullable<DemoTheme["cta_color"]>, string> = {
  orange: "oklch(0.70 0.18 55)",
  emerald: "oklch(0.60 0.16 165)",
  blue: "oklch(0.55 0.16 250)",
  rose: "oklch(0.60 0.16 15)",
  amber: "oklch(0.70 0.16 80)",
};

/**
 * Build CSS custom property overrides from a DemoTheme.
 * Apply the returned object as `style` on a wrapper div to scope the theme.
 */
export function getDemoThemeVars(
  theme?: DemoTheme | null
): React.CSSProperties {
  const accent = ACCENT_MAP[theme?.accent_color ?? "emerald"];
  const cta = CTA_MAP[theme?.cta_color ?? "orange"];

  return {
    "--primary": accent,
    "--ring": accent,
    "--demo-cta": cta,
  } as React.CSSProperties;
}
