import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isSafeLocalPath } from "@/lib/login-redirect";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string;
    reset?: string;
    error?: string;
    reason?: string;
    redirect?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const redirectParam = params.redirect;
  const redirectTo =
    typeof redirectParam === "string" && isSafeLocalPath(redirectParam)
      ? redirectParam
      : null;
  if (user) redirect(redirectTo ?? "/");
  return (
    <LoginForm
      showVerified={params.verified === "true"}
      showReset={params.reset === "true"}
      oauthError={
        params.error === "oauth" ? params.reason || "generic" : undefined
      }
      redirect={redirectTo}
    />
  );
}
