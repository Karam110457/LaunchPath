/**
 * CRO / Analytics event hooks for waitlist and landing page.
 * Wire these to your analytics provider (e.g. gtag, Plausible, PostHog) in one place.
 *
 * CRO BACKLOG — Next A/B tests to run:
 * 1. Hero CTA: "Reserve My Spot" vs "Get Founding Access"
 * 2. Step 2 required vs optional (completion rate vs list quality)
 * 3. Social proof: "Limited seats" vs "Founding cohort opens soon" only
 * 4. Headline: "Start shipping." vs "Start shipping one sellable system."
 * 5. FAQ position: above vs below final CTA
 * 6. Step 2 modal vs inline (conversion + completion)
 * 7. Trust section: bullets vs short paragraphs
 * 8. Nav CTA: same as hero vs "Join waitlist" (softer)
 * 9. Time-to-complete on steps: show vs hide
 * 10. Legal microcopy: short vs longer (trust vs friction)
 */

export type WaitlistEvent =
  | "waitlist_view"
  | "hero_cta_click"
  | "waitlist_step1_submitted"
  | "waitlist_step2_submitted"
  | "waitlist_step2_skipped"
  | "faq_opened"
  | "section_view";

export type SectionId = "problem" | "solution" | "why" | "faq";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

function getPayload(event: WaitlistEvent, props?: Record<string, string>) {
  return { event, ...props, page: "waitlist" };
}

export function trackWaitlistEvent(event: WaitlistEvent, props?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const payload = getPayload(event, props);

  // Custom event for GTM or other listeners
  window.dispatchEvent(
    new CustomEvent("launchpath_analytics", { detail: payload })
  );

  // gtag (Google Analytics 4)
  if (typeof window.gtag === "function") {
    window.gtag("event", event, { ...props, send_to: "default" });
  }

  // Plausible
  if (typeof window.plausible === "function") {
    window.plausible(event, { props: props ?? {} });
  }
}

export function trackSectionView(section: SectionId) {
  trackWaitlistEvent("section_view", { section });
}
