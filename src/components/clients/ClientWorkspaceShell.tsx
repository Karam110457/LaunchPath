"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";

interface ClientWorkspaceShellProps {
  children: React.ReactNode;
  clientId: string;
  clientName: string;
  clientLogo?: string | null;
  clientStatus: string;
}

const tabs = [
  { label: "Overview", href: "" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Conversations", href: "/conversations" },
  { label: "Settings", href: "/settings" },
];

export function ClientWorkspaceShell({
  children,
  clientId,
  clientName,
  clientLogo,
  clientStatus,
}: ClientWorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/dashboard/clients/${clientId}`;

  async function viewPortal() {
    await fetch("/api/portal/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    router.push("/portal");
  }

  function isActive(tabHref: string) {
    const fullPath = basePath + tabHref;
    if (tabHref === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(fullPath);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />
      <div className="relative z-10 flex flex-col flex-1 h-full overflow-y-auto">
        <TopNav />
        
        {/* Client Header & Tabs */}
        <div className="w-full max-w-7xl mx-auto px-6 pt-8 shrink-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/clients"
                className="p-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              {clientLogo ? (
                 <img src={clientLogo} alt={clientName} className="size-12 rounded-xl object-cover border border-border/40" />
              ) : (
                 <div className="size-12 rounded-xl bg-white dark:bg-[#252525] border border-black/5 dark:border-[#333333] flex items-center justify-center shadow-sm">
                   <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF8C00] to-[#9D50BB]">
                     {clientName.charAt(0).toUpperCase()}
                   </span>
                 </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-3xl font-semibold tracking-tight">{clientName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "text-xs px-3 py-0.5 rounded-full font-medium",
                      clientStatus === "active"
                        ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                        : clientStatus === "paused"
                          ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {clientStatus.charAt(0).toUpperCase() + clientStatus.slice(1)}
                  </span>
                  <button
                    onClick={viewPortal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Eye className="size-3.5" />
                    View Portal
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Pills */}
            <nav className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
                <Link
                  key={tab.label}
                  href={basePath + tab.href}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    isActive(tab.href)
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="w-full h-px bg-border/40 mb-8" />
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
