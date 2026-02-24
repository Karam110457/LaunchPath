"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedScoreProps {
  target: number;
  duration?: number;
  className?: string;
}

export function AnimatedScore({
  target,
  duration = 1200,
  className,
}: AnimatedScoreProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    // Respect reduced-motion preference — skip animation
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return (
    <span className={className} aria-label={`Score: ${target} out of 100`}>
      {value}
    </span>
  );
}
