"use client";

import { useState } from "react";
import { X, Loader2, Download, Database } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const CRM_SOURCES = [
  { value: "hubspot", label: "HubSpot" },
  { value: "salesforce", label: "Salesforce" },
  { value: "pipedrive", label: "Pipedrive" },
  { value: "zoho_crm", label: "Zoho CRM" },
  { value: "google_contacts", label: "Google Contacts" },
];

interface CrmImportDialogProps {
  campaignId: string;
  onDone: () => void;
  onClose: () => void;
}

interface PreviewContact {
  name?: string;
  phone?: string;
  email?: string;
}

export function CrmImportDialog({ campaignId, onDone, onClose }: CrmImportDialogProps) {
  const [toolkit, setToolkit] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewContacts, setPreviewContacts] = useState<PreviewContact[] | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!toolkit) return;
    setPreviewing(true);
    setError(null);
    setPreviewContacts(null);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/import-crm?preview=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Preview failed");
      }

      const data = await res.json();
      setPreviewContacts(data.contacts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    if (!toolkit) return;
    setImporting(true);
    setError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/contacts/import-crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Import failed");
      }

      const data = await res.json();
      setResult({ imported: data.imported, skipped: data.skipped });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141414] rounded-[2rem] shadow-2xl border border-neutral-200/50 dark:border-neutral-700/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/40">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Import from CRM</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* CRM Source */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">CRM Source</Label>
            <select
              value={toolkit}
              onChange={(e) => {
                setToolkit(e.target.value);
                setPreviewContacts(null);
                setResult(null);
              }}
              className={INPUT_CLASS}
            >
              <option value="">Select a CRM...</option>
              {CRM_SOURCES.map((src) => (
                <option key={src.value} value={src.value}>{src.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Requires an active Composio connection for the selected CRM.
            </p>
          </div>

          {/* Preview button */}
          {toolkit && !result && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Preview Contacts"}
            </button>
          )}

          {/* Preview table */}
          {previewContacts && !result && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{previewContacts.length} contacts found</p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200/50 dark:border-neutral-700/30">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200/50 dark:border-neutral-700/30">
                      <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Name</th>
                      <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Phone</th>
                      <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewContacts.slice(0, 20).map((c, i) => (
                      <tr key={i} className="border-b border-neutral-200/20 dark:border-neutral-700/20">
                        <td className="px-3 py-1.5 text-foreground">{c.name || "—"}</td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.phone || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30 p-4 text-center">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Import Complete
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {result.imported} imported, {result.skipped} skipped
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-200/50 dark:border-neutral-700/40">
          {result ? (
            <button
              type="button"
              onClick={() => { onDone(); }}
              className="px-5 py-2 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              {previewContacts && previewContacts.length > 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-1.5 px-5 py-2 text-[11px] font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Import {previewContacts.length} Contacts
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
