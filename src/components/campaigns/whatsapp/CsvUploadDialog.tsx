"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

interface CsvUploadDialogProps {
  campaignId: string;
  onDone: () => void;
  onClose: () => void;
}

type Step = "upload" | "mapping" | "result";

interface PreviewData {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

const MAPPABLE_FIELDS = [
  { value: "", label: "— Skip —" },
  { value: "phone", label: "Phone (required)" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "tags", label: "Tags (comma-separated)" },
];

export function CsvUploadDialog({
  campaignId,
  onDone,
  onClose,
}: CsvUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(f: File) {
    setFile(f);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("preview", "true");

      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data: PreviewData = await res.json();
      setPreview(data);

      // Auto-map obvious columns
      const autoMapping: Record<string, string> = {};
      for (const h of data.headers) {
        const lower = h.toLowerCase();
        if (lower === "phone" || lower === "phone_number" || lower === "mobile") {
          autoMapping[h] = "phone";
        } else if (lower === "name" || lower === "full_name" || lower === "contact_name") {
          autoMapping[h] = "name";
        } else if (lower === "email" || lower === "email_address") {
          autoMapping[h] = "email";
        } else if (lower === "tags" || lower === "tag") {
          autoMapping[h] = "tags";
        }
      }
      setMapping(autoMapping);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file || !preview) return;

    // Validate phone mapping exists
    const phoneCol = Object.entries(mapping).find(([, v]) => v === "phone");
    if (!phoneCol) {
      setError("You must map a column to Phone");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build reverse mapping: field -> csvColumn
      const reverseMapping: Record<string, string> = {};
      for (const [csvCol, field] of Object.entries(mapping)) {
        if (field) reverseMapping[field] = csvCol;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("preview", "false");
      formData.append("mapping", JSON.stringify(reverseMapping));
      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }

      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Import failed");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {step === "upload"
                ? "Upload Contacts"
                : step === "mapping"
                  ? "Map Columns"
                  : "Import Complete"}
            </h3>
            {preview && step !== "upload" && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {preview.totalRows} rows in {file?.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={step === "result" ? onDone : onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Step 1: Upload ─────────────────────────────────── */}
          {step === "upload" && (
            <>
              <div
                className="rounded-[20px] border-2 border-dashed border-neutral-300/60 dark:border-neutral-700/50 p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Drop CSV file or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Max 5MB, 10,000 rows. Must include a phone column.
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </>
          )}

          {/* ── Step 2: Column Mapping ────────────────────────── */}
          {step === "mapping" && preview && (
            <>
              <div className="space-y-3">
                {preview.headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="w-1/3 text-xs font-mono text-foreground truncate flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                      {header}
                    </div>
                    <span className="text-muted-foreground text-xs">&rarr;</span>
                    <select
                      value={mapping[header] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [header]: e.target.value,
                        }))
                      }
                      className={`${INPUT_CLASS} flex-1`}
                    >
                      {MAPPABLE_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              {preview.sampleRows.length > 0 && (
                <div className="rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-neutral-200/50 dark:border-neutral-700/50">
                        {preview.headers.map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-neutral-200/30 dark:border-neutral-700/30 last:border-0">
                          {preview.headers.map((h) => (
                            <td key={h} className="px-2 py-1 text-foreground/80 truncate max-w-[120px]">
                              {row[h] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Global tags */}
              <div className="space-y-1.5">
                <Label className="text-xs">Add Tags (optional)</Label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., campaign-q1, vip (comma-separated)"
                />
              </div>
            </>
          )}

          {/* ── Step 3: Results ────────────────────────────────── */}
          {step === "result" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Import Successful
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.imported} imported, {result.updated} updated, {result.skipped} skipped
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-[16px] border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-900/10 p-3 space-y-1.5">
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {result.errors.length} row{result.errors.length > 1 ? "s" : ""} skipped
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground">
                        Row {e.row}: {e.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {step === "mapping" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep("upload");
                    setFile(null);
                    setPreview(null);
                  }}
                  className="px-4 py-2 text-sm rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Import {preview?.totalRows ?? 0} Contacts
                    </>
                  )}
                </button>
              </>
            )}
            {step === "result" && (
              <button
                type="button"
                onClick={onDone}
                className="px-5 py-2 text-sm font-medium rounded-full gradient-accent-bg text-white shadow-md hover:scale-[1.02] transition-transform"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
