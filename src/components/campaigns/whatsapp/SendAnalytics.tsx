"use client";

import { Send, CheckCircle2, Eye, XCircle } from "lucide-react";
import type { SendJobRecord } from "./SendJobCard";

interface SendAnalyticsProps {
  jobs: SendJobRecord[];
}

export function SendAnalytics({ jobs }: SendAnalyticsProps) {
  if (jobs.length === 0) return null;

  const totals = jobs.reduce(
    (acc, j) => ({
      sent: acc.sent + j.sent_count,
      delivered: acc.delivered + j.delivered_count,
      read: acc.read + j.read_count,
      failed: acc.failed + j.failed_count,
      total: acc.total + j.total_contacts,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0, total: 0 }
  );

  const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0;
  const readRate = totals.delivered > 0 ? Math.round((totals.read / totals.delivered) * 100) : 0;
  const failRate = totals.total > 0 ? Math.round((totals.failed / totals.total) * 100) : 0;

  const stats = [
    { label: "Sent", value: totals.sent, icon: Send, color: "text-blue-500" },
    { label: "Delivered", value: `${totals.delivered} (${deliveryRate}%)`, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Read", value: `${totals.read} (${readRate}%)`, icon: Eye, color: "text-purple-500" },
    { label: "Failed", value: `${totals.failed} (${failRate}%)`, icon: XCircle, color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-xl border border-neutral-200/50 dark:border-neutral-700/30 bg-white/60 dark:bg-neutral-900/40 p-3 text-center"
          >
            <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-sm font-semibold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
