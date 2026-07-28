import { redirect } from "next/navigation";
import { setSessionFromToken } from "@/lib/actions/auth";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const { token, next } = await searchParams;
  if (!token) redirect("/login?error=1");
  await setSessionFromToken(token);
  redirect(next || "/");
}
