import { PortalSidebar } from "./PortalSidebar";

interface PortalShellProps {
  children: React.ReactNode;
  clientName: string;
  clientLogo?: string | null;
  role: "admin" | "viewer";
}

export function PortalShell({ children, clientName, clientLogo, role }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <PortalSidebar clientName={clientName} clientLogo={clientLogo} role={role} />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
