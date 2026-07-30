import * as Icons from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Where } from "payload";

import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import type { Place } from "@/payload-types";

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
        p.city.slug === params.city,
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <form action="/search" className="relative">
        <Icons.Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder={t("placeholder")}
          className="w-full rounded-2xl border border-border bg-white py-3.5 pl-12 pr-4 text-base shadow-sm transition-shadow placeholder:text-muted-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          aria-label={t("placeholder")}
        />
      </form>

      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
        {t("results")}
      </h1>

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
