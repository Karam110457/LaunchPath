"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Upload, Search, Loader2, Users, Tag, X, ChevronDown, Copy, Check, Link, Database } from "lucide-react";
import { ContactsList, type ContactRecord } from "./ContactsList";
import { CsvUploadDialog } from "./CsvUploadDialog";
import { AddContactDialog } from "./AddContactDialog";
import { ContactDetail } from "./ContactDetail";
import { CrmImportDialog } from "./CrmImportDialog";

interface ContactsTabProps {
  campaignId: string;
  channelId: string;
}

const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

type StatusFilter = "all" | "active" | "opted_out";

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "opted_out", label: "Opted Out" },
];

export function ContactsTab({ campaignId, channelId }: ContactsTabProps) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCrmImport, setShowCrmImport] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  void channelId; // Used by future CRM import

  function addTagFilter() {
    const tag = tagFilter.trim();
    if (tag && !activeTags.includes(tag)) {
      setActiveTags((prev) => [...prev, tag]);
    }
    setTagFilter("");
  }

  function removeTag(tag: string) {
    setActiveTags((prev) => prev.filter((t) => t !== tag));
  }

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      if (activeTags.length > 0) params.set("tags", activeTags.join(","));

      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [campaignId, statusFilter, search, activeTags]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => fetchContacts(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchContacts, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Contacts</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCrmImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Database className="w-3 h-3" />
            Import CRM
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Upload CSV
          </button>
          <button
            type="button"
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-3 h-3" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md">
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                style={isActive ? gradientBorderStyle : undefined}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all ${
                  isActive
                    ? "[--card-bg:#fff] dark:[--card-bg:#171717] border-transparent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          />
        </div>

        {/* Tag filter */}
        <div className="relative max-w-[180px]">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTagFilter(); }
            }}
            placeholder="Filter by tag…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          />
        </div>
      </div>

      {/* Active tag chips */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-foreground border border-[#FF8C00]/20"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setActiveTags([])}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 && !search && statusFilter === "all" ? (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="w-full rounded-xl border-2 border-dashed border-border/60 p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Users className="w-8 h-8" />
          <span className="text-sm font-medium">Import Your Contacts</span>
          <span className="text-xs">Upload a CSV or add contacts manually</span>
        </button>
      ) : (
        <ContactsList contacts={contacts} onSelect={setSelectedContact} />
      )}

      {/* CSV Upload Dialog */}
      {showUpload && (
        <CsvUploadDialog
          campaignId={campaignId}
          onDone={() => {
            setShowUpload(false);
            fetchContacts();
          }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Add Contact Dialog */}
      {showAddContact && (
        <AddContactDialog
          campaignId={campaignId}
          onDone={() => {
            setShowAddContact(false);
            fetchContacts();
          }}
          onClose={() => setShowAddContact(false)}
        />
      )}

      {/* CRM Import Dialog */}
      {showCrmImport && (
        <CrmImportDialog
          campaignId={campaignId}
          onDone={() => {
            setShowCrmImport(false);
            fetchContacts();
          }}
          onClose={() => setShowCrmImport(false)}
        />
      )}

      {/* Contact Detail Slide-over */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          campaignId={campaignId}
          onClose={() => setSelectedContact(null)}
          onSaved={() => {
            setSelectedContact(null);
            fetchContacts();
          }}
          onDeleted={() => {
            setSelectedContact(null);
            fetchContacts();
          }}
        />
      )}

      {/* CRM Integration Info */}
      <CrmWebhookInfo campaignId={campaignId} />
    </div>
  );
}

function CrmWebhookInfo({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const ingestUrl = `${appOrigin}/api/campaigns/${campaignId}/contacts/ingest`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-[16px] border border-neutral-200/50 dark:border-neutral-700/40 bg-neutral-50/50 dark:bg-neutral-800/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Link className="w-3.5 h-3.5" />
          CRM Integration / Webhook
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-200/50 dark:border-neutral-700/40 pt-3">
          <p className="text-[11px] text-muted-foreground">
            Push contacts from your CRM or other systems using this webhook endpoint.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Endpoint
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] font-mono bg-white dark:bg-neutral-900 rounded-lg px-2.5 py-1.5 border border-neutral-200/60 dark:border-neutral-700/50 text-foreground/80 break-all">
                POST {ingestUrl}
              </code>
              <button
                type="button"
                onClick={() => copy(ingestUrl, "url")}
                className="shrink-0 p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {copied === "url" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Auth Header
            </label>
            <code className="block text-[10px] font-mono bg-white dark:bg-neutral-900 rounded-lg px-2.5 py-1.5 border border-neutral-200/60 dark:border-neutral-700/50 text-foreground/80">
              Authorization: Bearer &lt;channel_token&gt;
            </code>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Example Payload
            </label>
            <pre className="text-[10px] font-mono bg-white dark:bg-neutral-900 rounded-lg px-2.5 py-2 border border-neutral-200/60 dark:border-neutral-700/50 text-foreground/80 whitespace-pre overflow-x-auto">
{`{
  "contacts": [{
    "phone": "+1234567890",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "tags": ["crm-sync"],
    "source": "hubspot",
    "source_id": "hs_12345"
  }]
}`}
            </pre>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Rate limit: 10 requests/min, max 100 contacts per request.
            Contacts are upserted by phone number.
          </p>
        </div>
      )}
    </div>
  );
}
