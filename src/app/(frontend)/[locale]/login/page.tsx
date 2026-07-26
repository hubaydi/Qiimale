import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "../components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  return <LoginForm existingUser={Boolean(user)} />;
}
