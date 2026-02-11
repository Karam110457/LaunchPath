"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  
  // Simple breadcrumb logic
  const segments = pathname.split("/").filter(Boolean);
  const title = segments[segments.length - 1];
  
  const displayTitle = title 
    ? title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, " ") 
    : "Overview";

  return (
    <header className="sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center px-6 md:px-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{displayTitle}</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {/* Actions or notifications could go here */}
      </div>
    </header>
  );
}
