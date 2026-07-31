import { ArrowRight, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import type { Category, City, Place, Review } from "@/payload-types";

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
        {title}
      </h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: "categories",
    limit: 8,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });
  const cities = await payload.find({
    collection: "cities",
    limit: 8,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });
  const topPlaces = await payload.find({
    collection: "places",
    where: { status: { equals: "approved" } },
    limit: 8,
    sort: "-ratingAvg",
    overrideAccess: true,
    locale,
    fallbackLocale: "so",
    depth: 1,
  });
  const latestPlaces = await payload.find({
    collection: "places",
    where: { status: { equals: "approved" } },
    limit: 8,
    sort: "-createdAt",
    overrideAccess: true,
    locale,
    fallbackLocale: "so",
    depth: 1,
  });
  const latestReviews = await payload.find({
    collection: "reviews",
    where: { status: { equals: "published" } },
    limit: 8,
    sort: "-createdAt",
    overrideAccess: true,
    depth: 2,
  });

  return (
    <div className="-mx-4 -mt-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-blue-600 px-4 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl font-jakarta">
            {t("App.name")}
          </h1>
          <p className="mt-3 text-lg text-white/80 sm:text-xl">
            {t("App.tagline")}
          </p>
          <form action="/search" className="relative mt-8 max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg flex items-center">
              <Search
                className="pointer-events-none ml-4 size-5 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder={t("Search.placeholder")}
                className="flex-1 bg-transparent py-3.5 px-3 text-base outline-none placeholder:text-muted-foreground"
                aria-label={t("Search.placeholder")}
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl m-1.5 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              >
                {t("Home.searchButton")}
              </button>
            </div>
          </form>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
            <MapPin size={14} />
            <span>200+ Places · 500+ Reviews · 10+ Cities</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12">
        {/* Categories */}
        <section>
          <SectionHeader
            title={t("Home.categories")}
            href="/categories"
            linkLabel={t("Home.viewAll")}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.docs.map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col justify-center gap-1.5 border border-border bg-white rounded-xl p-5 text-center transition-all duration-200 hover:border-blue-200 hover:shadow-sm min-h-[104px]"
              >
                <span className="text-sm font-medium text-foreground leading-tight">
                  {cat.name}
                </span>
                {cat.description ? (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {cat.description}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        {/* Cities */}
        <section>
          <SectionHeader
            title={t("Home.cities")}
            href="/cities"
            linkLabel={t("Home.viewAll")}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cities.docs.map((city: City) => (
              <Link
                key={city.id}
                href={`/cities/${city.slug}`}
                className="group flex flex-col items-center gap-2.5 border border-border bg-white rounded-xl p-5 text-center transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <MapPin size={20} />
                </div>
                <span className="text-sm font-medium text-foreground leading-tight">
                  {city.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top rated */}
        <section>
          <SectionHeader
            title={t("Home.topRated")}
            href="/places"
            linkLabel={t("Home.viewAll")}
          />
          {topPlaces.docs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPlaces.docs.map((p: Place) => (
                <PlaceCard key={p.id} place={p} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Search.empty")}</p>
          )}
        </section>

        {/* Latest places */}
        <section>
          <SectionHeader
            title={t("Home.latestPlaces")}
            href="/places"
            linkLabel={t("Home.viewAll")}
          />
          {latestPlaces.docs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestPlaces.docs.map((p: Place) => (
                <PlaceCard key={p.id} place={p} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Search.empty")}</p>
          )}
        </section>

        {/* Latest reviews */}
        <section>
          <SectionHeader title={t("Home.latestReviews")} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {latestReviews.docs.map((r: Review) => {
              const place =
                typeof r.place === "object" && r.place !== null
                  ? (r.place as Place)
                  : null;
              if (!place) return null;
              const preview =
                r.text.length > 120 ? `${r.text.slice(0, 120)}…` : r.text;
              return (
                <li key={r.id}>
                  <Link
                    href={`/place/${place.slug}`}
                    className="block border border-border bg-white rounded-xl p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground leading-snug">
                        {place.name}
                      </span>
                      <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                        {r.rating}★
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {preview}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
