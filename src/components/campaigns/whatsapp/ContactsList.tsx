"use client";

import { Phone, Mail, Tag, MessageCircle } from "lucide-react";

export interface ContactRecord {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  profile_name: string | null;
  tags: string[];
  status: string;
  source: string;
  custom_fields: Record<string, unknown>;
  last_replied_at: string | null;
  conversation_count: number;
  created_at: string;
}

interface ContactsListProps {
  contacts: ContactRecord[];
  onSelect?: (contact: ContactRecord) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  selectionMode?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ContactsList({ contacts, onSelect, selectedIds, onToggleSelect, onToggleAll, selectionMode }: ContactsListProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300/60 dark:border-neutral-700/50 bg-neutral-100/30 dark:bg-neutral-800/20 p-6">
        <p className="text-xs text-muted-foreground text-center">
          No contacts yet. Upload a CSV or add contacts manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header — hidden on small screens */}
      <div className={`hidden md:grid ${selectionMode ? "grid-cols-[28px_1fr_120px_100px_80px_60px]" : "grid-cols-[1fr_120px_100px_80px_60px]"} gap-3 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider`}>
        {selectionMode && (
          <input
            type="checkbox"
            checked={selectedIds?.size === contacts.length && contacts.length > 0}
            onChange={() => onToggleAll?.()}
            className="rounded accent-orange-500"
          />
        )}
        <span>Contact</span>
        <span>Phone</span>
        <span>Tags</span>
        <span>Source</span>
        <span className="text-right">Msgs</span>
      </div>

      {contacts.map((c) => (
        <div
          key={c.id}
          className={`w-full ${selectionMode ? "md:grid-cols-[28px_1fr_120px_100px_80px_60px]" : "md:grid-cols-[1fr_120px_100px_80px_60px]"} md:grid gap-3 items-center px-4 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left group flex flex-col md:flex-row cursor-pointer ${selectedIds?.has(c.id) ? "bg-orange-50/40 dark:bg-orange-900/10" : ""}`}
          onClick={() => selectionMode ? onToggleSelect?.(c.id) : onSelect?.(c)}
        >
          {selectionMode && (
            <input
              type="checkbox"
              checked={selectedIds?.has(c.id) ?? false}
              onChange={() => onToggleSelect?.(c.id)}
              onClick={(e) => e.stopPropagation()}
              className="rounded accent-orange-500"
            />
          )}
          {/* Name + email + phone (stacked on mobile) */}
          <div className="min-w-0 w-full md:w-auto">
            <p className="text-sm font-medium text-foreground truncate">
              {c.name || c.profile_name || "Unknown"}
            </p>
            {c.email && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                {c.email}
              </p>
            )}
            {/* Phone inline on mobile */}
            <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5 md:hidden">
              <Phone className="w-3 h-3 shrink-0" />
              {c.phone}
            </p>
          </div>

          {/* Phone — desktop only */}
          <span className="hidden md:flex text-xs text-muted-foreground font-mono items-center gap-1">
            <Phone className="w-3 h-3 shrink-0" />
            {c.phone.length > 12 ? `${c.phone.slice(0, 4)}...${c.phone.slice(-4)}` : c.phone}
          </span>

          {/* Tags */}
          <div className="flex items-center gap-1 overflow-hidden mt-1 md:mt-0">
            {c.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-neutral-100 dark:bg-neutral-800 text-muted-foreground truncate max-w-[60px]"
              >
                <Tag className="w-2.5 h-2.5 shrink-0" />
                {tag}
              </span>
            ))}
            {c.tags.length > 2 && (
              <span className="text-[9px] text-muted-foreground">+{c.tags.length - 2}</span>
            )}
          </div>

          {/* Source — hidden on mobile */}
          <span className="hidden md:block text-[10px] text-muted-foreground capitalize">
            {c.source?.replace("_", " ") ?? "—"}
          </span>

          {/* Conversation count — hidden on mobile */}
          <span className="hidden md:flex text-xs text-muted-foreground text-right items-center justify-end gap-1">
            <MessageCircle className="w-3 h-3" />
            {c.conversation_count ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}
