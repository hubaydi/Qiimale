import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AddPlaceForm } from "@/components/AddPlaceForm";
import { getCurrentUser } from "@/lib/session";

export default async function AddPlacePage() {
  const t = await getTranslations("AddPlace");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("success").split(".")[0]}
        </p>
      </div>
      <AddPlaceForm />
    </div>
  );
}
