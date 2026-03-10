"use client";

import { useState } from "react";
import { usePortal, usePortalCan } from "@/contexts/PortalContext";
import { Hand, Pause, Play, X } from "lucide-react";

interface ConversationControlsProps {
  conversationId: string;
  status: string;
  onStatusChange: (newStatus: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  paused: { label: "Paused", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  human_takeover: { label: "Human Takeover", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  closed: { label: "Closed", color: "bg-zinc-500/10 text-zinc-500" },
};

export function ConversationControls({
  conversationId,
  status,
  onStatusChange,
}: ConversationControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const canTakeover = usePortalCan("conversation.takeover");
  const canPause = usePortalCan("conversation.pause");
  const canResume = usePortalCan("conversation.resume");
  const canClose = usePortalCan("conversation.close");

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.active;

  async function updateStatus(newStatus: string) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/portal/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(newStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>

      <div className="flex items-center gap-2">
        {status === "active" && canTakeover && (
          <button
            onClick={() => updateStatus("human_takeover")}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors duration-150 disabled:opacity-50"
          >
            <Hand className="size-3.5" />
            Take Over
          </button>
        )}

        {status === "active" && canPause && (
          <button
            onClick={() => updateStatus("paused")}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors duration-150 disabled:opacity-50"
          >
            <Pause className="size-3.5" />
            Pause
          </button>
        )}

        {(status === "paused" || status === "human_takeover") && canResume && (
          <button
            onClick={() => updateStatus("active")}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors duration-150 disabled:opacity-50"
          >
            <Play className="size-3.5" />
            Resume AI
          </button>
        )}

        {status !== "closed" && canClose && (
          <button
            onClick={() => updateStatus("closed")}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20 transition-colors duration-150 disabled:opacity-50"
          >
            <X className="size-3.5" />
            Close
          </button>
        )}
      </div>
    </div>
  );
}
