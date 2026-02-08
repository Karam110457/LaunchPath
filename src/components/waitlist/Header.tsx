"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";

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
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="font-serif italic text-2xl text-white tracking-tight hover:opacity-80 transition-opacity">
          LaunchPath
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <button onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
            The Problem
          </button>
          <button onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
            How it Works
          </button>
          <button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">
            FAQ
          </button>
        </nav>

        <Button 
          onClick={scrollToWaitlist}
          variant="outline"
          className="bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white transition-all rounded-full px-6"
        >
          Join Waitlist
        </Button>
      </div>
    </header>
  );
}
