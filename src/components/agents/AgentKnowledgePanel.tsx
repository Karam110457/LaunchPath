"use client";

/**
 * AgentKnowledgePanel — manage an agent's knowledge base.
 * Upload files (PDF/TXT/MD), scrape websites, add FAQ pairs.
 * Lists all documents with status + delete.
 */

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
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KnowledgeDocument {
  id: string;
  source_type: "file" | "website" | "faq";
  source_name: string;
  content: string | null;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  error_message?: string | null;
  created_at: string;
}

interface AgentKnowledgePanelProps {
  agentId: string;
  initialDocuments: KnowledgeDocument[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentKnowledgePanel({
  agentId,
  initialDocuments,
}: AgentKnowledgePanelProps) {
  const [documents, setDocuments] =
    useState<KnowledgeDocument[]>(initialDocuments);
  const [activeSection, setActiveSection] = useState<
    "upload" | "website" | "faq" | null
  >(null);

  // Refresh documents list from API
  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch {
      // Silent — stale list is acceptable
    }
  }, [agentId]);

  // Handle new document added
  const handleDocumentAdded = useCallback(
    (doc: KnowledgeDocument) => {
      setDocuments((prev) => [doc, ...prev]);
      setActiveSection(null);
      // If it was processing, poll for completion
      if (doc.status === "processing") {
        setTimeout(refreshDocuments, 3000);
      }
    },
    [refreshDocuments]
  );

  // Delete document
  const handleDelete = useCallback(
    async (documentId: string) => {
      try {
        const res = await fetch(
          `/api/agents/${agentId}/knowledge?documentId=${documentId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        }
      } catch {
        // Silent
      }
    },
    [agentId]
  );

  return (
    <div className="grid gap-6 max-w-3xl">
      {/* Add Knowledge Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Knowledge
          </CardTitle>
          <CardDescription>
            Give your agent domain expertise by adding documents, websites, or
            FAQs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Source type buttons */}
          <div className="grid gap-3 sm:grid-cols-3">
            <SourceButton
              icon={<Upload className="w-5 h-5" />}
              label="Upload File"
              description="PDF, TXT, or MD"
              active={activeSection === "upload"}
              onClick={() =>
                setActiveSection(activeSection === "upload" ? null : "upload")
              }
            />
            <SourceButton
              icon={<Globe className="w-5 h-5" />}
              label="Import Website"
              description="Scrape a URL"
              active={activeSection === "website"}
              onClick={() =>
                setActiveSection(activeSection === "website" ? null : "website")
              }
            />
            <SourceButton
              icon={<MessageSquarePlus className="w-5 h-5" />}
              label="Add FAQ"
              description="Question & answer"
              active={activeSection === "faq"}
              onClick={() =>
                setActiveSection(activeSection === "faq" ? null : "faq")
              }
            />
          </div>

          {/* Expandable forms */}
          {activeSection === "upload" && (
            <div className="mt-4 pt-4 border-t border-border">
              <FileUploadForm
                agentId={agentId}
                onSuccess={handleDocumentAdded}
                onCancel={() => setActiveSection(null)}
              />
            </div>
          )}
          {activeSection === "website" && (
            <div className="mt-4 pt-4 border-t border-border">
              <WebsiteScrapeForm
                agentId={agentId}
                onSuccess={handleDocumentAdded}
                onCancel={() => setActiveSection(null)}
              />
            </div>
          )}
          {activeSection === "faq" && (
            <div className="mt-4 pt-4 border-t border-border">
              <FaqForm
                agentId={agentId}
                onSuccess={handleDocumentAdded}
                onCancel={() => setActiveSection(null)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Knowledge Sources</span>
            {documents.length > 0 && (
              <Badge variant="secondary">{documents.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Documents, websites, and FAQs your agent can reference during
            conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No knowledge sources yet.</p>
              <p className="text-xs mt-1">
                Add files, websites, or FAQs above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source Type Button
// ---------------------------------------------------------------------------

function SourceButton({
  icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer
        ${
          active
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border hover:border-primary/30 hover:bg-muted/50"
        }
      `}
    >
      <div
        className={`shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// File Upload Form
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
    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
    ];
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
    [handleFile]
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
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : selectedFile
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {selectedFile ? (
          <>
            <FileText className="w-8 h-8 text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Click to upload</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PDF, TXT, or MD (max 25MB)
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Uploading...
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
// Website Scrape Form
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

    // Basic URL validation
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="scrape-url">Website URL</Label>
        <Input
          id="scrape-url"
          type="text"
          placeholder="https://example.com/about"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll extract the text content from this page.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!url.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Importing...
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
// FAQ Form
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="faq-question">Question</Label>
        <Input
          id="faq-question"
          type="text"
          placeholder="What are your business hours?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="faq-answer">Answer</Label>
        <Textarea
          id="faq-answer"
          placeholder="We're open Monday through Friday, 9 AM to 5 PM."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!question.trim() || !answer.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Adding...
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
// Document Row
// ---------------------------------------------------------------------------

const sourceIcons: Record<string, React.ReactNode> = {
  file: <FileText className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  faq: <HelpCircle className="w-4 h-4" />,
};

const sourceLabels: Record<string, string> = {
  file: "File",
  website: "Website",
  faq: "FAQ",
};

function DocumentRow({
  document: doc,
  onDelete,
}: {
  document: KnowledgeDocument;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
      {/* Icon */}
      <div className="shrink-0 text-muted-foreground">
        {sourceIcons[doc.source_type] ?? <FileText className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {doc.source_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {sourceLabels[doc.source_type] ?? doc.source_type}
          </span>
          {doc.status === "ready" && doc.chunk_count > 0 && (
            <>
              <span className="text-xs text-muted-foreground/40">&middot;</span>
              <span className="text-xs text-muted-foreground">
                {doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0">
        {doc.status === "processing" && (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        )}
        {doc.status === "ready" && (
          <Badge
            variant="outline"
            className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950"
          >
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </Badge>
        )}
        {doc.status === "error" && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Error
          </Badge>
        )}
      </div>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="shrink-0 p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete knowledge source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{doc.source_name}&rdquo; and
              all its embeddings. Your agent will no longer reference this
              content.
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
