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
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`pointer-events-auto transition-all duration-300 ease-out ${
          scrolled ? "pt-4 px-4 md:pt-6 md:px-6" : "pt-0 px-0"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-300 ease-out ${
            scrolled
              ? "max-w-6xl mx-auto rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30 py-3 px-5 md:px-6 md:py-4"
              : "container mx-auto px-4 py-6"
          }`}
        >
          <Link
            href="/"
            className="text-white hover:opacity-80 transition-opacity"
            aria-label="LaunchPath home"
          >
            <Logo className="text-2xl" />
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
            className="min-h-[44px] min-w-[44px] bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white transition-all rounded-full px-6"
            aria-label="Reserve my spot"
          >
            Reserve My Spot
          </Button>
        </div>
      </div>
    </header>
  );
}
