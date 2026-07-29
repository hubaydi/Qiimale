import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RegisterForm } from "../components/RegisterForm";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <RegisterForm />;
}
