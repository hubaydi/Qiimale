import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
import { visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import { AddPlaceForm } from "./_component/AddPlaceForm";

export default async function AddPlacePage() {
  const t = await getTranslations("AddPlace");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const payload = await getPayloadClient();

  const [cities, cats] = await Promise.all([
    payload.find({
      collection: "cities",
      where: visibleContentQuery(user),
      limit: 100,
      overrideAccess: true,
    }),
    payload.find({
      collection: "categories",
      where: visibleContentQuery(user),
      limit: 100,
      overrideAccess: true,
    }),
  ]);

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("success").split(".")[0]}
        </p>
      </div>
      <AddPlaceForm
        cities={cities.docs.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
        }))}
        categories={cats.docs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          status: c.status,
        }))}
      />
    </div>
  );
}
