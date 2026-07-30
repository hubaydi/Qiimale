import { getLocale, getTranslations } from "next-intl/server";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import type { Place } from "@/payload-types";

export default async function PlacesPage() {
  const t = await getTranslations("Places");
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const places = await payload.find({
    collection: "places",
    where: { status: { equals: "approved" } },
    limit: 100,
    sort: "-createdAt",
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
    depth: 1,
  });

  if (places.docs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
        {t("title")}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.docs.map((p: Place) => (
          <PlaceCard key={p.id} place={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
