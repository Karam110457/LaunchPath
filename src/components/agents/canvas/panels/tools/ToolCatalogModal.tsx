"use client";

import {
  CalendarCheck,
  Users,
  UserCheck,
  Webhook,
  Plug,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOOL_CATALOG } from "@/lib/tools/catalog";
import { cn } from "@/lib/utils";
import type { ToolCatalogEntry, ToolType } from "@/lib/tools/types";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck,
  Users,
  UserCheck,
  Webhook,
  Plug,
};

const CATEGORY_LABELS: Record<string, string> = {
  booking: "Booking",
  crm: "CRM",
  communication: "Communication",
  automation: "Automation",
  advanced: "Advanced",
};

interface ToolCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toolType: string) => void;
  existingTypes: ToolType[];
}

export function ToolCatalogModal({
  open,
  onClose,
  onSelect,
  existingTypes,
}: ToolCatalogModalProps) {
  // Group by category
  const grouped: Record<string, ToolCatalogEntry[]> = {};
  for (const entry of TOOL_CATALOG) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Tool</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a tool to give your agent new capabilities.
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {Object.entries(grouped).map(([category, entries]) => (
            <div key={category}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className="space-y-2">
                {entries.map((entry) => {
                  const Icon = ICON_MAP[entry.icon] ?? Plug;
                  const alreadyAdded = existingTypes.includes(entry.type);

                  return (
                    <button
                      key={entry.type}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => onSelect(entry.type)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3.5 flex items-start gap-3.5 transition-all",
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed border-border/50 bg-muted/20"
                          : "border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {entry.name}
                          </span>
                          {alreadyAdded && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                              Added
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {entry.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
