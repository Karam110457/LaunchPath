import { requireAuth } from "@/lib/auth/guards";

export default async function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <div className="h-[100dvh] overflow-hidden bg-white">{children}</div>;
}
