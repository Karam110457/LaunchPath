"use client";

import { useEffect } from "react";
import { trackSectionView, type SectionId } from "@/lib/analytics";

const SECTIONS: SectionId[] = ["problem", "solution", "why", "faq"];

export function SectionViewTracker() {
  useEffect(() => {
    const seen = new Set<SectionId>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id as SectionId;
          if (SECTIONS.includes(id) && !seen.has(id)) {
            seen.add(id);
            trackSectionView(id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -20% 0px" }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return null;
}
