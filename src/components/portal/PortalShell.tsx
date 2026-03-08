import { PortalSidebar } from "./PortalSidebar";

interface PortalShellProps {
  children: React.ReactNode;
  clientName: string;
  clientLogo?: string | null;
}

export function PortalShell({ children, clientName, clientLogo }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-background flex font-sans overflow-hidden relative">
      <div className="h-screen shrink-0 overflow-hidden py-4 pl-4 w-[320px] hidden md:block">
        <PortalSidebar clientName={clientName} clientLogo={clientLogo} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
