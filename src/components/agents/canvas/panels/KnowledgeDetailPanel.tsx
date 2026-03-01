"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Globe,
  MessageSquarePlus,
  Trash2,
  FileText,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KnowledgeDocument {
  id: string;
  source_type: "file" | "website" | "faq";
  source_name: string;
  content: string | null;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  created_at: string;
}

interface KnowledgeDetailPanelProps {
  agentId: string;
  initialDocuments: KnowledgeDocument[];
}

export function KnowledgeDetailPanel({
  agentId,
  initialDocuments,
}: KnowledgeDetailPanelProps) {
  const [documents, setDocuments] =
    useState<KnowledgeDocument[]>(initialDocuments);
  const [activeForm, setActiveForm] = useState<
    "upload" | "website" | "faq" | null
  >(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch {
      // Network error — will retry on next interval
    }
  }, [agentId]);

  // Poll every 3s while any document is still processing
  const hasProcessing = documents.some((d) => d.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(refreshDocuments, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing, refreshDocuments]);

  const handleDocumentAdded = useCallback(
    (doc: KnowledgeDocument) => {
      setDocuments((prev) => [doc, ...prev]);
      setActiveForm(null);
    },
    [],
  );

  const [panelError, setPanelError] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (documentId: string) => {
      setPanelError(null);
      try {
        const res = await fetch(
          `/api/agents/${agentId}/knowledge?documentId=${documentId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        } else {
          setPanelError("Failed to delete document.");
        }
      } catch {
        setPanelError("Network error. Please check your connection.");
      }
    },
    [agentId],
  );

  const handleRetry = useCallback(
    async (documentId: string) => {
      try {
        const res = await fetch(
          `/api/agents/${agentId}/knowledge/retry`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId }),
          },
        );
        if (res.ok) {
          // Mark as processing — the useEffect interval will auto-poll
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === documentId
                ? { ...d, status: "processing" as const, error_message: null }
                : d,
            ),
          );
        }
      } catch {
        // Network error — user can retry manually
      }
    },
    [agentId],
  );

  const handleFaqEdit = useCallback(
    async (documentId: string, question: string, answer: string) => {
      setPanelError(null);
      try {
        const res = await fetch(`/api/agents/${agentId}/knowledge/faq`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, question, answer }),
        });
        if (res.ok) {
          setEditingDocId(null);
          refreshDocuments();
        } else {
          const data = await res.json();
          setPanelError(data.error || "Failed to update FAQ.");
        }
      } catch {
        setPanelError("Network error. Please check your connection.");
      }
    },
    [agentId, refreshDocuments],
  );

  return (
    <div className="p-5 space-y-5">
      {panelError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive flex-1">{panelError}</p>
          <button
            type="button"
            onClick={() => setPanelError(null)}
            className="shrink-0 p-0.5 text-destructive/60 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {/* Add Knowledge — stacked vertically for modal */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Add documents, websites, or FAQs to your agent&apos;s knowledge.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setActiveForm(activeForm === "upload" ? null : "upload")
            }
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs transition-all ${activeForm === "upload" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
          >
            <Upload className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">File</span>
          </button>
          <button
            onClick={() =>
              setActiveForm(activeForm === "website" ? null : "website")
            }
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs transition-all ${activeForm === "website" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
          >
            <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">Website</span>
          </button>
          <button
            onClick={() => setActiveForm(activeForm === "faq" ? null : "faq")}
            className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs transition-all ${activeForm === "faq" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50"}`}
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">FAQ</span>
          </button>
        </div>
      </div>

      {/* Expandable form */}
      {activeForm === "upload" && (
        <FileUploadForm
          agentId={agentId}
          onSuccess={handleDocumentAdded}
          onCancel={() => setActiveForm(null)}
        />
      )}
      {activeForm === "website" && (
        <WebsiteScrapeForm
          agentId={agentId}
          onSuccess={handleDocumentAdded}
          onCancel={() => setActiveForm(null)}
        />
      )}
      {activeForm === "faq" && (
        <FaqForm
          agentId={agentId}
          onSuccess={handleDocumentAdded}
          onCancel={() => setActiveForm(null)}
        />
      )}

      {/* Divider */}
      <hr className="border-border" />

      {/* Document list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Sources{" "}
            {documents.length > 0 && (
              <span className="text-muted-foreground">
                ({documents.length})
              </span>
            )}
          </h3>
        </div>

        {documents.length > 3 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No knowledge sources yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {documents
            .filter((doc) =>
              !searchQuery.trim() ||
              doc.source_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              doc.source_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
            )
            .map((doc) => (
              <div key={doc.id}>
                <DocumentRow
                  document={doc}
                  onDelete={handleDelete}
                  onRetry={handleRetry}
                  onEdit={
                    doc.source_type === "faq"
                      ? () => setEditingDocId(doc.id)
                      : undefined
                  }
                  isEditing={editingDocId === doc.id}
                />
                {editingDocId === doc.id && (
                  <FaqEditForm
                    document={doc}
                    onSave={(q, a) => handleFaqEdit(doc.id, q, a)}
                    onCancel={() => setEditingDocId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File Upload Form (bulk support)
// ---------------------------------------------------------------------------

function FileUploadForm({
  agentId,
  onSuccess,
  onCancel,
}: {
  agentId: string;
  onSuccess: (doc: KnowledgeDocument) => void;
  onCancel: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
  ];

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format.`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 25MB limit.`);
        return;
      }
    }
    setError(null);
    setSelectedFiles((prev) => [...prev, ...fileArray]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/agents/${agentId}/knowledge/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload failed: ${file.name}`);
        onSuccess(data as KnowledgeDocument);
      }
      setSelectedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-1.5 p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : selectedFiles.length > 0 ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.csv"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0)
              handleFiles(e.target.files);
          }}
        />
        <Upload className="w-6 h-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">Click</span> or drag
          &mdash; PDF, TXT, MD, DOCX, CSV (max 25MB)
        </p>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-1">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-muted-foreground shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              Uploading
            </>
          ) : (
            `Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""}`
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Website Scrape Form (compact)
// ---------------------------------------------------------------------------

function WebsiteScrapeForm({
  agentId,
  onSuccess,
  onCancel,
}: {
  agentId: string;
  onSuccess: (doc: KnowledgeDocument) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scraping failed");
      onSuccess(data as KnowledgeDocument);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scraping failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="scrape-url" className="text-xs">
          Website URL
        </Label>
        <Input
          id="scrape-url"
          type="text"
          placeholder="https://example.com/about"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="h-9 text-sm"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!url.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              Importing
            </>
          ) : (
            "Import"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FAQ Form (compact)
// ---------------------------------------------------------------------------

function FaqForm({
  agentId,
  onSuccess,
  onCancel,
}: {
  agentId: string;
  onSuccess: (doc: KnowledgeDocument) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add FAQ");
      onSuccess(data as KnowledgeDocument);
      setQuestion("");
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add FAQ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="faq-q" className="text-xs">
          Question
        </Label>
        <Input
          id="faq-q"
          placeholder="What are your business hours?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="faq-a" className="text-xs">
          Answer
        </Label>
        <Textarea
          id="faq-a"
          placeholder="We're open Monday through Friday, 9 AM to 5 PM."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isLoading}
          rows={2}
          className="text-sm"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!question.trim() || !answer.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              Adding
            </>
          ) : (
            "Add FAQ"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FAQ Edit Form (inline, below document row)
// ---------------------------------------------------------------------------

function FaqEditForm({
  document: doc,
  onSave,
  onCancel,
}: {
  document: KnowledgeDocument;
  onSave: (question: string, answer: string) => void;
  onCancel: () => void;
}) {
  // Parse existing Q/A from content field (format: "Q: ...\nA: ...")
  // Use indexOf instead of regex to handle questions with newlines or "A:" text
  const parsedAnswer = (() => {
    if (!doc.content) return "";
    const separator = "\nA: ";
    const sepIndex = doc.content.indexOf(separator);
    if (sepIndex === -1) return doc.content;
    return doc.content.slice(sepIndex + separator.length).trim();
  })();
  const [question, setQuestion] = useState(doc.source_name);
  const [answer, setAnswer] = useState(parsedAnswer);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setIsLoading(true);
    onSave(question.trim(), answer.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="ml-6 mt-1 mb-2 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
    >
      <div className="space-y-1">
        <Label className="text-xs">Question</Label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="h-8 text-xs"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Answer</Label>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={2}
          className="text-xs"
          placeholder="Enter the updated answer"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs"
          disabled={!question.trim() || !answer.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Document Row (compact)
// ---------------------------------------------------------------------------

const sourceIcons: Record<string, React.ReactNode> = {
  file: <FileText className="w-3.5 h-3.5" />,
  website: <Globe className="w-3.5 h-3.5" />,
  faq: <HelpCircle className="w-3.5 h-3.5" />,
};

function DocumentRow({
  document: doc,
  onDelete,
  onRetry,
  onEdit,
  isEditing,
}: {
  document: KnowledgeDocument;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  onEdit?: () => void;
  isEditing?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors group ${isEditing ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/30"}`}
    >
      <div className="shrink-0 text-muted-foreground">
        {sourceIcons[doc.source_type] ?? <FileText className="w-3.5 h-3.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">
          {doc.source_name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {doc.source_type === "file"
            ? "File"
            : doc.source_type === "website"
              ? "Website"
              : "FAQ"}
          {doc.status === "ready" &&
            doc.chunk_count > 0 &&
            ` · ${doc.chunk_count} chunks`}
        </p>
      </div>

      {/* Status */}
      {doc.status === "processing" && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
      )}
      {doc.status === "ready" && (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      )}
      {doc.status === "error" && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <button
            type="button"
            onClick={() => onRetry(doc.id)}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            title="Retry import"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Edit (FAQ only) */}
      {onEdit && doc.status !== "processing" && (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
          title="Edit FAQ"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete knowledge source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{doc.source_name}&rdquo; and
              all its embeddings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(doc.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
