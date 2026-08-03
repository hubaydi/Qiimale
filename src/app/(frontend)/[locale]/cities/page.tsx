import * as Icons from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getPayloadClient } from "@/lib/get-payload";
import { visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { Place } from "@/payload-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";
  const t = await getTranslations("Seo");

  return {
    title: t("citiesTitle"),
    description: t("citiesDescription"),
    alternates: {
      canonical: so ? "/cities" : "/en/cities",
      languages: {
        so: "/cities",
        en: "/en/cities",
      },
    },
  };
}

export default async function CitiesPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();
  const user = await getCurrentUser();

  const cities = await payload.find({
    collection: "cities",
    where: visibleContentQuery(user),
    limit: 100,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const cityPlaces = await Promise.all(
    cities.docs.map((city) =>
      payload.find({
        collection: "places",
        where: {
          and: [
            visibleContentQuery(user),
            { "city.slug": { equals: city.slug } },
          ],
        },
        limit: 8,
        sort: ["-ratingAvg", "-reviewCount"],
        overrideAccess: true,
        depth: 1,
        locale,
        fallbackLocale: "so",
      }),
    ),
  );

  const addLink = (
    <Link
      href="/cities/add-city"
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift hover:bg-primary/90"
    >
      <Icons.Plus size={16} />
      {t("Nav.addCity")}
    </Link>
  );

  if (cities.docs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">{t("Cities.empty")}</p>
        <div className="flex justify-center">{addLink}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Cities.title")}
        </h1>
        {addLink}
      </div>
      {cities.docs.map((city, i) => {
        const places = cityPlaces[i].docs;
        return (
          <section key={city.id}>
            <SectionHeader
              title={city.name}
              href={`/cities/${city.slug}`}
              linkLabel={t("Home.viewAll")}
              action={
                city.status === "pending" ? (
                  <span className="rounded-full bg-rating/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-rating">
                    {locale === "so" ? "Tusaale" : "Preview"}
                  </span>
                ) : undefined
              }
            />
            {places.length > 0 ? (
              <StaggerGroup className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {places.map((p: Place) => (
                  <StaggerItem key={p.id}>
                    <PlaceCard place={p} locale={locale} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("Search.empty")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
