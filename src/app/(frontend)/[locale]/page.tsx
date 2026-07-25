import * as Icons from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
import type { Category, Place, Review } from "@/payload-types";
import { PlaceCard } from "./components/PlaceCard";

export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: "categories",
    limit: 50,
    locale,
    fallbackLocale: "so",
  });
  const topPlaces = await payload.find({
    collection: "places",
    where: { status: { equals: "approved" } },
    limit: 6,
    sort: "-ratingAvg",
    overrideAccess: true,
    locale,
    fallbackLocale: "so",
    depth: 1,
  });
  const latestReviews = await payload.find({
    collection: "reviews",
    where: { status: { equals: "published" } },
    limit: 5,
    sort: "-createdAt",
    overrideAccess: true,
    depth: 2,
  });

  return (
    <div className="space-y-10">
      <form action="/search" className="max-w-xl mx-auto">
        <input
          name="q"
          placeholder={t("Search.placeholder")}
          className="w-full rounded-lg border px-4 py-3"
          aria-label={t("Search.placeholder")}
        />
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("Nav.search")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.docs.map((cat: Category) => {
            const iconKey = cat.icon as keyof typeof Icons | undefined;
            // biome-ignore lint/performance/noDynamicNamespaceImportAccess: lucide icon lookup
            const iconComponent = iconKey ? Icons[iconKey] : null;
            const Icon =
              (iconComponent as React.ComponentType<{ size?: number }>) ||
              Icons.Tag;
            return (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}`}
                className="rounded-lg border p-4 hover:bg-muted/50"
              >
                <Icon size={20} />
                <div className="mt-1 text-sm">{cat.name}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("Place.rating")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {topPlaces.docs.map((p: Place) => (
            <PlaceCard key={p.id} place={p} locale={locale} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("Nav.home")}</h2>
        <ul className="space-y-2 text-sm">
          {latestReviews.docs.map((r: Review) => {
            const place =
              typeof r.place === "object" && r.place !== null
                ? (r.place as Place)
                : null;
            return place ? (
              <li key={r.id}>
                <Link
                  href={`/place/${place.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {place.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  — {r.rating}★ · {r.text.slice(0, 80)}…
                </span>
              </li>
            ) : null;
          })}
        </ul>
      </section>
    </div>
  );
}
