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
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ContactsList({ contacts, onSelect }: ContactsListProps) {
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
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_100px_80px_60px] gap-3 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        <span>Contact</span>
        <span>Phone</span>
        <span>Tags</span>
        <span>Source</span>
        <span className="text-right">Msgs</span>
      </div>

      {contacts.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect?.(c)}
          className="w-full grid grid-cols-[1fr_120px_100px_80px_60px] gap-3 items-center px-4 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left group"
        >
          {/* Name + email */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {c.name || c.profile_name || "Unknown"}
            </p>
            {c.email && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                {c.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <Phone className="w-3 h-3 shrink-0" />
            {c.phone.length > 12 ? `${c.phone.slice(0, 4)}...${c.phone.slice(-4)}` : c.phone}
          </span>

          {/* Tags */}
          <div className="flex items-center gap-1 overflow-hidden">
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

          {/* Source */}
          <span className="text-[10px] text-muted-foreground capitalize">
            {c.source?.replace("_", " ") ?? "—"}
          </span>

          {/* Conversation count */}
          <span className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1">
            <MessageCircle className="w-3 h-3" />
            {c.conversation_count ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
