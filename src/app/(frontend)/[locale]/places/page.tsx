import { getLocale, getTranslations } from "next-intl/server";
import { StaggerGroup, StaggerItem } from "@/components/motion";
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
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
        <span className="inline-block h-5 w-1 rounded-full bg-primary" />
        {t("title")}
      </h1>
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.docs.map((p: Place) => (
          <StaggerItem key={p.id}>
            <PlaceCard place={p} locale={locale} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
