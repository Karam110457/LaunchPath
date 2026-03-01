"use client";

import { useState, useCallback, useRef } from "react";
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

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch {
      /* silent */
    }
  }, [agentId]);

  const handleDocumentAdded = useCallback(
    (doc: KnowledgeDocument) => {
      setDocuments((prev) => [doc, ...prev]);
      setActiveForm(null);
      if (doc.status === "processing") {
        setTimeout(refreshDocuments, 3000);
      }
    },
    [refreshDocuments],
  );

  const handleDelete = useCallback(
    async (documentId: string) => {
      try {
        const res = await fetch(
          `/api/agents/${agentId}/knowledge?documentId=${documentId}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        }
      } catch {
        /* silent */
      }
    },
    [agentId],
  );

  return (
    <div className="p-5 space-y-5">
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

        {documents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No knowledge sources yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File Upload Form (compact)
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ["application/pdf", "text/plain", "text/markdown"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, TXT, and MD files are supported.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File must be under 25MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`/api/agents/${agentId}/knowledge/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onSuccess(data as KnowledgeDocument);
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
        className={`relative flex flex-col items-center justify-center gap-1.5 p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : selectedFile ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {selectedFile ? (
          <>
            <FileText className="w-6 h-6 text-primary" />
            <p className="text-xs font-medium">{selectedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Click</span> or drag
              &mdash; PDF, TXT, MD (max 25MB)
            </p>
          </>
        )}
      </div>

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
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              Uploading
            </>
          ) : (
            "Upload"
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
}: {
  document: KnowledgeDocument;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
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
        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
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
