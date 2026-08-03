import * as Icons from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { StaggerGroup, StaggerItem } from "@/components/motion";
import { getPayloadClient } from "@/lib/get-payload";
import { visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { City } from "@/payload-types";

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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Cities.title")}
        </h1>
        {addLink}
      </div>
      <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cities.docs.map((city: City) => (
          <StaggerItem key={city.id}>
            <Link
              href={`/cities/${city.slug}`}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/30"
            >
              {city.status === "pending" && (
                <span className="absolute top-2 right-2 rounded-full bg-rating/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-rating">
                  {locale === "so" ? "Tusaale" : "Preview"}
                </span>
              )}
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icons.MapPin size={20} />
              </div>
              <span className="text-sm font-medium text-foreground leading-tight">
                {city.name}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
