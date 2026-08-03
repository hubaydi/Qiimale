import * as Icons from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Where } from "payload";

import { StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
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
    title: t("searchTitle"),
    description: t("searchDescription"),
    alternates: {
      canonical: so ? "/search" : "/en/search",
      languages: {
        so: "/search",
        en: "/en/search",
      },
    },
  };
}

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <form action="/search" className="relative">
        <Icons.Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          name="q"
          required
          defaultValue={params.q ?? ""}
          placeholder={t("placeholder")}
          className="w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-base shadow-soft transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lift focus:outline-none"
          aria-label={t("placeholder")}
        />
      </form>

      <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
        <span className="inline-block h-5 w-1 rounded-full bg-primary" />
        {t("results")}
      </h1>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((p: Place) => (
            <StaggerItem key={p.id}>
              <PlaceCard place={p} locale={locale} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
