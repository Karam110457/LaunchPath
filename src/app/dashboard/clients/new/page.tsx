"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      email: (form.get("email") as string) || undefined,
      website: (form.get("website") as string) || undefined,
    };

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create client");
        setSaving(false);
        return;
      }

      const { client } = await res.json();
      router.push(`/dashboard/clients/${client.id}`);
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Business Name *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Acme Dentistry"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Contact Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="contact@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="website" className="text-sm font-medium">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="https://example.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
