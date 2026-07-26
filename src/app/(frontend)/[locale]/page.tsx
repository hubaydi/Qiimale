import * as Icons from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getPayloadClient } from "@/lib/get-payload";
import type { Category, Place, Review } from "@/payload-types";
import { PlaceCard } from "./components/PlaceCard";

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
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel}
          <Icons.ArrowRight className="size-3.5" />
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
    <div className="-mx-4 -mt-6">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-linear-to-b from-muted/60 to-background px-4 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-muted)_0%,transparent_70%)] opacity-60"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("App.name")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t("App.tagline")}
          </p>
          <form action="/search" className="relative mt-8">
            <Icons.Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              name="q"
              placeholder={t("Search.placeholder")}
              className="w-full rounded-xl border bg-background py-3.5 pr-28 pl-12 text-base shadow-sm transition-shadow placeholder:text-muted-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring/50"
              aria-label={t("Search.placeholder")}
            />
            <Button
              type="submit"
              size="lg"
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              {t("Home.searchButton")}
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12">
        {/* Categories */}
        <section>
          <SectionHeader title={t("Home.categories")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                  className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-4 text-center ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium leading-tight">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Top rated */}
        <section>
          <SectionHeader
            title={t("Home.topRated")}
            href="/search"
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
                    className="block rounded-xl border bg-card p-4 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium leading-snug">
                        {place.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
