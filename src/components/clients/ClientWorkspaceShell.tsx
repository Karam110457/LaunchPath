"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const basePath = `/dashboard/clients/${clientId}`;

  function isActive(tabHref: string) {
    const fullPath = basePath + tabHref;
    if (tabHref === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(fullPath);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 px-6 py-3">
          <Link
            href="/dashboard/clients"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          {clientLogo ? (
            <img
              src={clientLogo}
              alt={clientName}
              className="size-8 rounded object-cover"
            />
          ) : (
            <span className="size-8 rounded bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {clientName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{clientName}</h1>
          </div>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              clientStatus === "active"
                ? "bg-emerald-500/10 text-emerald-600"
                : clientStatus === "paused"
                  ? "bg-yellow-500/10 text-yellow-600"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {clientStatus}
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex px-6 gap-1 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={basePath + tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                isActive(tab.href)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
