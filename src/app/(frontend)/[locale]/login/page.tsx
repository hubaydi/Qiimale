import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string;
    reset?: string;
    error?: string;
    reason?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const params = await searchParams;
  return (
    <LoginForm
      showVerified={params.verified === "true"}
      showReset={params.reset === "true"}
      oauthError={
        params.error === "oauth" ? params.reason || "generic" : undefined
      }
    />
  );
}
