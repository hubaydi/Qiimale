import * as Icons from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
import type { Category, Place } from "@/payload-types";
import { PlaceCard } from "../../components/PlaceCard";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = rawLocale as "so" | "en";
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    fallbackLocale: "so",
  });
  const category = result.docs[0] as Category | undefined;
  return {
    title: category?.name ? `${category.name} — Qiimale` : "Qiimale",
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
  });
  const category = result.docs[0] as Category | undefined;
  if (!category) notFound();

  const iconKey = category.icon as keyof typeof Icons | undefined;
  // biome-ignore lint/performance/noDynamicNamespaceImportAccess: lucide icon lookup
  const iconComponent = iconKey ? Icons[iconKey] : null;
  const Icon =
    (iconComponent as React.ComponentType<{ size?: number }>) || Icons.Tag;

  const places = await payload.find({
    collection: "places",
    where: {
      and: [
        { status: { equals: "approved" } },
        { "category.slug": { equals: slug } },
      ],
    },
    limit: 50,
    sort: "-ratingAvg",
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: "so",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={24} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {category.name}
        </h1>
      </div>
      {places.docs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          <Icons.SearchX className="mx-auto size-8 mb-3 opacity-50" />
          No places in this category yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {places.docs.map((p: Place) => (
            <PlaceCard key={p.id} place={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
