import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { RegisterForm } from "../components/RegisterForm";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <RegisterForm />;
}
