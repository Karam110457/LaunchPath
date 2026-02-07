import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/guards";

/** Dashboard is protected: redirect to login if not authenticated. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/dashboard" className="font-semibold">
            LaunchPath
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Home
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
