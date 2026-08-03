import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import { canViewOwnPending, visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { Place } from "@/payload-types";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = rawLocale as "so" | "en";
  const t = await getTranslations("Seo");
  const so = locale === "so";

  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "categories",
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "approved" } }],
    },
    limit: 1,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const category = result.docs[0];
  if (!category) return {};

  return {
    title: `${category.name} — Qiimale`,
    description: t("categoryDescription", { category: category.name }),
    alternates: {
      canonical: so ? `/categories/${slug}` : `/en/categories/${slug}`,
      languages: {
        so: `/categories/${slug}`,
        en: `/en/categories/${slug}`,
      },
    },
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const category = result.docs[0];
  const user = await getCurrentUser();
  if (!category || !canViewOwnPending(category, user)) notFound();

  const places = await payload.find({
    collection: "places",
    where: {
      and: [visibleContentQuery(user), { "category.slug": { equals: slug } }],
    },
    limit: 50,
    sort: ["-ratingAvg", "-reviewCount"],
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: "so",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <Reveal as="div" className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        ) : null}
      </Reveal>
      {places.docs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          <SearchX className="mx-auto size-8 mb-3 opacity-50" />
          No places in this category yet.
        </p>
      ) : (
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {places.docs.map((p: Place) => (
            <StaggerItem key={p.id}>
              <PlaceCard place={p} locale={locale} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
