"use client";

import {
  Wrench,
  Calendar,
  Mail,
  Users,
  Globe,
  MessageSquare,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TOOL_ICONS: Record<string, React.ElementType> = {
  calendar: Calendar,
  email: Mail,
  "lead-capture": Users,
  "knowledge-base": Globe,
  "human-handoff": ArrowRightLeft,
  messaging: MessageSquare,
};

interface ToolDetailPanelProps {
  tool: {
    tool_id: string;
    label: string;
    description: string;
  };
}

export function ToolDetailPanel({ tool }: ToolDetailPanelProps) {
  const Icon = TOOL_ICONS[tool.tool_id] ?? Wrench;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{tool.label}</h3>
          <Badge variant="secondary" className="text-[10px] mt-0.5">
            {tool.tool_id}
          </Badge>
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Description
        </h4>
        <p className="text-sm text-foreground">{tool.description}</p>
      </div>

      <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
        <p className="text-xs text-muted-foreground">
          This tool is available to your agent during conversations. It will be
          used automatically when relevant to the user&apos;s request.
        </p>
      </div>
    </div>
  );
}
