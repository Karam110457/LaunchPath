"use client";

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "bg-emerald-500",
  Anthropic: "bg-amber-500",
  Google: "bg-blue-500",
  Meta: "bg-violet-500",
  Mistral: "bg-rose-500",
};

const PROVIDER_DOT_COLORS: Record<string, string> = {
  OpenAI: "bg-emerald-500",
  Anthropic: "bg-amber-500",
  Google: "bg-blue-500",
  Meta: "bg-violet-500",
  Mistral: "bg-rose-500",
};

function getColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "bg-neutral-400";
}

function getDotColor(provider: string): string {
  return PROVIDER_DOT_COLORS[provider] ?? "bg-neutral-400";
}

interface ProviderBreakdownProps {
  data: Array<{ provider: string; credits: number; messages: number }>;
}

export function ProviderBreakdown({ data }: ProviderBreakdownProps) {
  if (!data.length) return null;

  const totalCredits = data.reduce((sum, d) => sum + d.credits, 0);
  if (totalCredits === 0) return null;

  return (
    <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm space-y-3">
      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-neutral-200/40 dark:bg-neutral-800/40">
        {data.map((d) => {
          const pct = (d.credits / totalCredits) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={d.provider}
              className={`h-full ${getColor(d.provider)} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {data.map((d) => {
          const pct =
            totalCredits > 0
              ? Math.round((d.credits / totalCredits) * 100)
              : 0;
          return (
            <div
              key={d.provider}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${getDotColor(d.provider)} shrink-0`}
              />
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {d.provider}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {d.credits.toLocaleString()} cr ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
