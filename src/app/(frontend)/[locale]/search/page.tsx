import { getLocale, getTranslations } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
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

  const and: any[] = [{ status: { equals: "approved" } }];
  if (params.q) and.push({ name: { contains: params.q } });
  const placeDocs = await payload.find({
    collection: "places",
    where: { and },
    limit: 40,
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: "so",
  });

  let filtered = placeDocs.docs;
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
    if (params.q)
      filtered = filtered.filter((p: any) =>
        p.name.toLowerCase().includes(params.q!.toLowerCase()),
      );
  }
  if (params.city)
    filtered = filtered.filter(
      (p: any) => typeof p.city === "object" && p.city?.slug === params.city,
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("results")}</h1>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((p: any) => (
            <PlaceCard key={p.id} place={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
