"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Upload, Search, Loader2, Users, Tag, X, ChevronDown, Copy, Check, Link, Database, ChevronLeft, ChevronRight, Calendar, CheckSquare, Trash2 } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) || "all"
  );
  const [showUpload, setShowUpload] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCrmImport, setShowCrmImport] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? []
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const pageSize = 50;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  void channelId; // Used by future CRM import

  // Persist filters in URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (activeTags.length > 0) params.set("tags", activeTags.join(","));
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [search, statusFilter, activeTags, dateFrom, dateTo, page, router]);

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  }

  async function bulkTag() {
    const tag = bulkTagInput.trim();
    if (!tag || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/campaigns/${campaignId}/contacts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ add_tags: [tag] }),
          })
        )
      );
      setBulkTagInput("");
      setSelectedIds(new Set());
      fetchContacts();
    } catch { /* ignore */ }
    setBulkLoading(false);
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} contact(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/campaigns/${campaignId}/contacts/${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds(new Set());
      fetchContacts();
    } catch { /* ignore */ }
    setBulkLoading(false);
  }

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setFetchError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      if (activeTags.length > 0) params.set("tags", activeTags.join(","));
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts ?? []);
        setTotal(data.total ?? 0);
      } else {
        setFetchError("Failed to load contacts");
      }
    } catch {
      setFetchError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [campaignId, statusFilter, search, activeTags, dateFrom, dateTo, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, activeTags, dateFrom, dateTo]);

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
            onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${
              selectionMode
                ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                : "border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            {selectionMode ? "Cancel" : "Select"}
          </button>
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

      {/* Date range filter */}
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="text-xs rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-1.5 outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          placeholder="From"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="text-xs rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-1.5 outline-none focus:ring-2 focus:ring-neutral-400/20 transition-all"
          placeholder="To"
        />
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
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

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{fetchError}</p>
          <button type="button" onClick={() => fetchContacts()} className="text-xs text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/30">
          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-1.5 flex-1">
            <input
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); bulkTag(); } }}
              placeholder="Add tag…"
              className="px-2.5 py-1 text-xs rounded-full border border-orange-200/60 dark:border-orange-800/40 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-orange-300/30 w-32"
            />
            <button
              type="button"
              onClick={bulkTag}
              disabled={!bulkTagInput.trim() || bulkLoading}
              className="px-3 py-1 text-[11px] font-medium rounded-full gradient-accent-bg text-white disabled:opacity-50"
            >
              Tag
            </button>
          </div>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-medium rounded-full border border-red-200/60 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Delete
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
        <>
          <ContactsList
            contacts={contacts}
            onSelect={setSelectedContact}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
          />
          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium text-foreground px-2">
                  {page} / {Math.ceil(total / pageSize)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="p-1.5 rounded-lg border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
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
