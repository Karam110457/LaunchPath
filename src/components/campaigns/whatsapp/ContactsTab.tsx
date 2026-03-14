"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Upload, Search, Loader2, Users } from "lucide-react";
import { ContactsList, type ContactRecord } from "./ContactsList";
import { CsvUploadDialog } from "./CsvUploadDialog";

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

  // Suppress unused var warning — channelId is used for future contact detail
  void channelId;

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

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
  }, [campaignId, statusFilter, search]);

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
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Upload CSV
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: add single contact dialog
            }}
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
      </div>

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
        <ContactsList contacts={contacts} />
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
    </div>
  );
}
