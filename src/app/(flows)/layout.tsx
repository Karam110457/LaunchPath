import { requireAuth } from "@/lib/auth/guards";

export default async function FlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <div className="fixed inset-0 bg-white overflow-hidden">{children}</div>;
}
