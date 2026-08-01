import * as Icons from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import type { City, Place } from "@/payload-types";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = rawLocale as "so" | "en";

  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "cities",
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "approved" } }],
    },
    limit: 1,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });
  const city = result.docs[0];
  return {
    title: city?.name
      ? `${city.name} — Qiimaynta ganacsiyada kuyaalla Magaalada ${city.name}`
      : "Qiimale",
    description:
      "Eeg Goobaha ugu fiican dadkuna amaaneen ee ku yaaalla Magaalada " +
      city?.name,
  };
}

export default async function CityDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("Cities");
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "cities",
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "approved" } }],
    },
    limit: 1,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const city = result.docs[0] as City | undefined;
  if (!city) notFound();

  const places = await payload.find({
    collection: "places",
    where: {
      and: [
        { status: { equals: "approved" } },
        { "city.slug": { equals: slug } },
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
          <Icons.MapPin size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {city.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("placesIn", { city: city.name })}
          </p>
        </div>
      </div>
      {places.docs.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          <Icons.SearchX className="mx-auto size-8 mb-3 opacity-50" />
          No places in this city yet.
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
