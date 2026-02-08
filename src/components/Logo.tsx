import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

/**
 * Brand logo in CreatorCollege style: "Launch" bold sans-serif, "Path" italic serif.
 */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("tracking-tight inline-flex", className)}>
      <span className="font-bold font-sans">Launch</span>
      <span className="font-serif italic">Path</span>
    </span>
  );
}
