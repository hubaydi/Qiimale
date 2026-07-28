import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "../components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  return (
    <LoginForm
      existingUser={Boolean(user)}
      showVerified={params.verified === "true"}
      showReset={params.reset === "true"}
    />
  );
}
