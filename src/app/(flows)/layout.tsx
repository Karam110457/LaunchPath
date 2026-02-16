import { requireAuth } from "@/lib/auth/guards";

export default async function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <div className="min-h-screen bg-background">{children}</div>;
}
