import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { AddCategoryForm } from "./_component/AddCategoryForm";

export default async function AddCategoryPage() {
  const t = await getTranslations("AddCategory");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("success")}</p>
      </div>
      <AddCategoryForm />
    </div>
  );
}
