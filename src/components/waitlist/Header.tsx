"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { trackWaitlistEvent } from "@/lib/analytics";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWaitlist = () => {
    const form = document.querySelector("form");
    if (form) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      form.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out">
      <div className={scrolled ? "pt-4 px-4 md:pt-6 md:px-6" : ""}>
        <div
          className={`flex items-center justify-between transition-all duration-300 ease-out ${
            scrolled
              ? "max-w-6xl mx-auto rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 py-3 px-5 md:px-6"
              : "container mx-auto px-4 py-6"
          }`}
        >
          <Link href="/" className="font-serif italic text-2xl text-white tracking-tight hover:opacity-80 transition-opacity">
            LaunchPath
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground" aria-label="Main">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("problem");
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
              }}
              className="min-h-[44px] min-w-[44px] flex items-center hover:text-white transition-colors"
            >
              The Problem
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("solution");
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
              }}
              className="min-h-[44px] min-w-[44px] flex items-center hover:text-white transition-colors"
            >
              How it Works
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("faq");
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
              }}
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
