import { PortalSidebar } from "./PortalSidebar";

interface PortalShellProps {
  children: React.ReactNode;
  clientName: string;
  clientLogo?: string | null;
  role: "admin" | "viewer";
  previewMode?: boolean;
}

export function PortalShell({ children, clientName, clientLogo, role, previewMode }: PortalShellProps) {
  return (
    <div className={`min-h-screen bg-background flex ${previewMode ? "pt-10" : ""}`}>
      <PortalSidebar clientName={clientName} clientLogo={clientLogo} role={role} />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
