"use client";

import { useRouter } from "next/navigation";
import { Eye, ArrowLeft } from "lucide-react";

interface PreviewBannerProps {
  clientName: string;
  clientId: string;
}

export function PreviewBanner({ clientName, clientId }: PreviewBannerProps) {
  const router = useRouter();

  async function exitPreview() {
    await fetch("/api/portal/impersonate", { method: "DELETE" });
    router.push(`/dashboard/clients/${clientId}`);
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-black dark:bg-white text-white dark:text-black">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="size-4" />
          <span>
            Previewing <strong>{clientName}</strong>&apos;s portal
          </span>
        </div>
        <button
          onClick={exitPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white dark:bg-black text-black dark:text-white hover:bg-white/80 dark:hover:bg-black/80 transition-colors"
        >
          <ArrowLeft className="size-3" />
          Exit Preview
        </button>
      </div>
    </div>
  );
}
