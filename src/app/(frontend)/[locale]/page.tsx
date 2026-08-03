import { ArrowRight, MapPin, Plus, Search, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { Input } from "@/components/ui/input";
import { getPayloadClient } from "@/lib/get-payload";
import { SITE_URL } from "@/lib/site-url";
import type { Category, City, Place, Review } from "@/payload-types";

function SectionHeader({
  title,
  href,
  linkLabel,
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      as="div"
      className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
        <span className="inline-block h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <div
        className={`flex w-full items-center gap-2 sm:w-auto sm:justify-end ${
          action ? "justify-between" : "justify-end"
        }`}
      >
        {action}
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 group/link"
          >
            {linkLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";
  const t = await getTranslations("Seo");

  return {
    title: "Qiimale",
    description: t("homeDescription"),
    alternates: {
      canonical: so ? "/" : "/en",
      languages: { so: "/", en: "/en" },
    },
    openGraph: {
      title: "Qiimale",
      description: t("homeDescription"),
      url: so ? SITE_URL : `${SITE_URL}/en`,
      siteName: "Qiimale",
      locale: so ? "so_SO" : "en_US",
      type: "website",
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: "categories",
    where: { status: { equals: "approved" } },
    limit: 8,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });
  const cities = await payload.find({
    collection: "cities",
    where: { status: { equals: "approved" } },
    limit: 8,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });
  const topPlaces = await payload.find({
    collection: "places",
    where: { status: { equals: "approved" } },
    limit: 8,
    sort: ["-ratingAvg", "-reviewCount"],
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
      <section
        aria-label="hero"
        className="relative overflow-hidden rounded-b-3xl bg-linear-[135deg,_oklch(0.45_0.24_262)_0%,_oklch(0.546_0.222_258)_45%,_oklch(0.48_0.2_270)_100%] px-4 py-16 sm:py-24"
      >
        {/* gradient mesh layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 0%, oklch(0.62 0.22 262 / 0.65) 0%, transparent 60%), radial-gradient(60% 60% at 90% 20%, oklch(0.7 0.18 300 / 0.45) 0%, transparent 55%), radial-gradient(70% 70% at 60% 100%, oklch(0.36 0.21 268 / 0.6) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal
            as="h1"
            delay={0.05}
            className="mt-5 font-jakarta text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            {t("App.name")}
          </Reveal>
          <Reveal
            as="p"
            delay={0.1}
            className="mt-3 text-lg text-white/80 sm:text-xl"
          >
            {t("App.tagline")}
          </Reveal>
          <Reveal
            as="div"
            delay={0.15}
            className="relative mt-8 max-w-xl mx-auto"
          >
            <form action="/search">
              <div className="flex items-center gap-2 rounded-2xl bg-white/90 p-2 shadow-float  ring-white/30 backdrop-blur-md">
                <Search
                  className="pointer-events-none ml-3 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  name="q"
                  required
                  placeholder={t("Search.placeholder")}
                  className="h-auto flex-1 border-0 bg-transparent px-2 py-2.5 shadow-none"
                  aria-label={t("Search.placeholder")}
                />
                <button
                  type="submit"
                  className="shrink-0 whitespace-nowrap rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-lift sm:px-5 cursor-pointer"
                >
                  {t("Home.searchButton")}
                </button>
              </div>
            </form>
          </Reveal>
          <Reveal
            as="div"
            delay={0.2}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70"
          >
            <MapPin size={14} />
            <span>200+ Places · 500+ Reviews · 10+ Cities</span>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14">
        {/* Top rated */}
        <section>
          <SectionHeader
            title={t("Home.topRated")}
            href="/places"
            linkLabel={t("Home.viewAll")}
          />
          {topPlaces.docs.length > 0 ? (
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPlaces.docs.map((p: Place) => (
                <StaggerItem key={p.id}>
                  <PlaceCard place={p} locale={locale} />
                </StaggerItem>
              ))}
            </StaggerGroup>
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
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestPlaces.docs.map((p: Place) => (
                <StaggerItem key={p.id}>
                  <PlaceCard place={p} locale={locale} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Search.empty")}</p>
          )}
        </section>

        {/* Latest reviews */}
        <section>
          <SectionHeader title={t("Home.latestReviews")} />
          <StaggerGroup className="grid gap-3 sm:grid-cols-2">
            {latestReviews.docs.map((r: Review) => {
              const place =
                typeof r.place === "object" && r.place !== null
                  ? (r.place as Place)
                  : null;
              if (!place) return null;
              const preview =
                r.text.length > 120 ? `${r.text.slice(0, 120)}…` : r.text;
              return (
                <StaggerItem key={r.id}>
                  <Link
                    href={`/places/${place.slug}`}
                    className="block rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground leading-snug">
                        {place.name}
                      </span>
                      <span className="shrink-0 rounded-lg bg-rating/10 px-2 py-0.5 text-xs font-semibold text-rating">
                        {r.rating}★
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {preview}
                    </p>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </section>

        {/* Categories */}
        <section>
          <SectionHeader
            title={t("Home.categories")}
            href="/categories"
            linkLabel={t("Home.viewAll")}
            action={
              <Link
                href="/categories/add-category"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-border/70"
              >
                <Plus size={14} />
                {t("Nav.addCategory")}
              </Link>
            }
          />
          <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.docs.map((cat: Category) => (
              <StaggerItem key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/30"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Tag size={20} />
                  </div>
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {cat.name}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Cities */}
        <section>
          <SectionHeader
            title={t("Home.cities")}
            href="/cities"
            linkLabel={t("Home.viewAll")}
            action={
              <Link
                href="/cities/add-city"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-border/70"
              >
                <Plus size={14} />
                {t("Nav.addCity")}
              </Link>
            }
          />
          <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cities.docs.map((city: City) => (
              <StaggerItem key={city.id}>
                <Link
                  href={`/cities/${city.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-5 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/30"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <MapPin size={20} />
                  </div>
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {city.name}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      </div>
    </div>
  );
}
