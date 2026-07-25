import { getLocale, getTranslations } from "next-intl/server";
import type { Where } from "payload";
import { getPayloadClient } from "@/lib/get-payload";
import type { Place } from "@/payload-types";
import { PlaceCard } from "../components/PlaceCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const t = await getTranslations("Search");
  const locale = (await getLocale()) as "so" | "en";
  const params = await searchParams;
  const payload = await getPayloadClient();

  const andConditions: Where[] = [{ status: { equals: "approved" } }];
  if (params.q) andConditions.push({ name: { contains: params.q } });
  const placeDocs = await payload.find({
    collection: "places",
    where: { and: andConditions },
    limit: 40,
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: "so",
  });

  let filtered: Place[] = placeDocs.docs;
  if (params.category) {
    filtered = (
      await payload.find({
        collection: "places",
        where: {
          and: [
            { status: { equals: "approved" } },
            { "category.slug": { equals: params.category } },
          ],
        },
        limit: 40,
        overrideAccess: true,
        depth: 1,
        locale,
        fallbackLocale: "so",
      })
    ).docs;
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter((p: Place) =>
        p.name.toLowerCase().includes(q),
      );
    }
  }
  if (params.city)
    filtered = filtered.filter(
      (p: Place) =>
        typeof p.city === "object" &&
        p.city !== null &&
        (p.city as { slug?: string }).slug === params.city,
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("results")}</h1>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((p: Place) => (
            <PlaceCard key={p.id} place={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
