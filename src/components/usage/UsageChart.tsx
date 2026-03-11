"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsageChartProps {
  data: Array<{ date: string; credits: number; messages: number }>;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const credits = payload.find((p) => p.dataKey === "credits")?.value ?? 0;
  const messages = payload.find((p) => p.dataKey === "messages")?.value ?? 0;

  return (
    <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-md text-sm">
      <p className="font-medium text-neutral-800 dark:text-neutral-200 mb-1">
        {formatDate(label)}
      </p>
      <p className="text-neutral-600 dark:text-neutral-400 tabular-nums">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {credits.toLocaleString()}
        </span>{" "}
        credits
      </p>
      <p className="text-neutral-600 dark:text-neutral-400 tabular-nums">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {messages.toLocaleString()}
        </span>{" "}
        messages
      </p>
    </div>
  );
}

export function UsageChart({ data }: UsageChartProps) {
  if (!data.length) return null;

  return (
    <div className="w-full h-[280px] rounded-2xl bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A] shadow-sm p-4 pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF8C00" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#9D50BB" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF8C00" />
              <stop offset="100%" stopColor="#9D50BB" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: "currentColor" }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "currentColor" }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
            dx={-4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="credits"
            stroke="url(#chartStroke)"
            strokeWidth={2.5}
            fill="url(#chartGradient)"
            dot={false}
            activeDot={{
              r: 5,
              stroke: "#FF8C00",
              strokeWidth: 2,
              fill: "white",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
