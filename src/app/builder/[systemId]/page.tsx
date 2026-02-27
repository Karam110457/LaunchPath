import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ systemId: string }>;
}

export default async function BuilderRedirect({ params }: Props) {
  const { systemId } = await params;
  redirect(`/dashboard/systems/${systemId}/builder`);
}
