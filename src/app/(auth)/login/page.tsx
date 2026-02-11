import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/guards";
import { LoginForm } from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getOptionalUser();
  if (user) {
    const { redirectTo } = await searchParams;
    redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
  }

  const { redirectTo } = await searchParams;
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  return <LoginForm redirectTo={safeRedirect} />;
}
