"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { trackWaitlistEvent } from "@/lib/analytics";

function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  el.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    // Check immediately in case page is already scrolled
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWaitlist = useCallback(() => {
    const form =
      document.getElementById("waitlist-form") ??
      document.querySelector("form");
    if (form) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      form.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[var(--safe-area-inset-top)] isolate [transform:translateZ(0)] [backface-visibility:hidden]">
      <div
        className={`pointer-events-auto md:transition-all md:duration-300 md:ease-out ${
          scrolled ? "pt-3 px-3 sm:pt-4 sm:px-4 md:pt-6 md:px-6" : "pt-0 px-0"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-3 md:transition-all md:duration-300 md:ease-out ${
            scrolled
              ? "max-w-6xl mx-auto rounded-xl md:rounded-2xl bg-black/60 md:bg-black/40 border border-white/10 shadow-lg md:shadow-2xl md:shadow-black/30 py-2.5 px-3 sm:py-3 sm:px-5 md:px-6 md:py-4 md:backdrop-blur-xl"
              : "container mx-auto px-3 py-4 sm:px-4 sm:py-5 md:py-6"
          }`}
        >
          <Link
            href="/"
            className="text-white hover:opacity-80 transition-opacity shrink-0 min-h-[44px] flex items-center"
            aria-label="LaunchPath home"
          >
            <Logo className="text-xl sm:text-2xl" />
          </Link>

          <nav
            className="hidden md:flex items-center gap-8 text-sm text-muted-foreground"
            aria-label="Main"
          >
            <button
              type="button"
              onClick={() => smoothScroll("problem")}
              className="min-h-[44px] min-w-[44px] flex items-center hover:text-white transition-colors"
            >
              The Problem
            </button>
            <button
              type="button"
              onClick={() => smoothScroll("solution")}
              className="min-h-[44px] min-w-[44px] flex items-center hover:text-white transition-colors"
            >
              How it Works
            </button>
            <button
              type="button"
              onClick={() => smoothScroll("faq")}
              className="min-h-[44px] min-w-[44px] flex items-center hover:text-white transition-colors"
            >
              FAQ
            </button>
          </nav>

          <Button
            onClick={() => {
              trackWaitlistEvent("hero_cta_click", { location: "nav" });
              scrollToWaitlist();
            }}
            variant="outline"
            className="min-h-[44px] shrink-0 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white transition-all text-sm sm:text-base px-4 sm:px-6 py-2 touch-manipulation"
            aria-label="Reserve my spot"
          >
            Reserve My Spot
          </Button>
        </div>
      </div>
    </header>
  );
}
