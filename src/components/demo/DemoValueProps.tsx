"use client";

import {
  BarChart3,
  Clock,
  Target,
  Shield,
  Zap,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import type { Benefit } from "@/lib/ai/schemas";

interface DemoValuePropsProps {
  benefits?: Benefit[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  chart: BarChart3,
  clock: Clock,
  target: Target,
  shield: Shield,
  zap: Zap,
  users: Users,
};

const DEFAULT_BENEFITS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get a detailed assessment of your business potential in seconds.",
  },
  {
    icon: Target,
    title: "Personalized Scoring",
    description: "AI evaluates your situation against proven success patterns.",
  },
  {
    icon: BarChart3,
    title: "Actionable Next Steps",
    description: "Receive clear recommendations tailored to your priorities.",
  },
];

export function DemoValueProps({ benefits }: DemoValuePropsProps) {
  const items =
    benefits && benefits.length > 0
      ? benefits.map((b) => ({
          Icon: ICON_MAP[b.icon] ?? Zap,
          title: b.title,
          description: b.description,
        }))
      : DEFAULT_BENEFITS.map((b) => ({
          Icon: b.icon,
          title: b.title,
          description: b.description,
        }));

  return (
    <ScrollReveal className="max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 space-y-3 text-center transition-colors duration-300 hover:border-primary/20 hover:bg-card/60"
          >
            <div className="inline-flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
              <item.Icon className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
