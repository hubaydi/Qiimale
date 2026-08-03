import type { Metadata } from "next";
import type { City, Category, Place } from "@/payload-types";
import { SITE_URL } from "./site-url";

export function placePageHref(slug: string, locale: "so" | "en"): string {
  const seg = locale === "so" ? "" : "/en";
  return `${seg}/places/${slug}`;
}

export function placeTitle(place: Place, locale: "so" | "en"): string {
  const suffix = locale === "so" ? "Qiimayn Qiimale" : "Qiimale";
  return `${place.name} — ${suffix}`;
}

export function placeDescription(place: Place, locale: "so" | "en"): string {
  if (place.description) return place.description;

  const city =
    typeof place.city === "object" && place.city !== null
      ? (place.city as City).name
      : null;
  const rating = place.ratingAvg?.toFixed(1) ?? "0.0";
  const count = place.reviewCount ?? 0;

  if (locale === "so") {
    return `${place.name}${city ? ` ee ${city}` : ""} — ${rating}★ laga bilaabo ${count} qiimayn oo Qiimale ah`;
  }
  return `${place.name}${city ? ` in ${city}` : ""} — ${rating}★ from ${count} reviews on Qiimale`;
}

function localeUrl(href: string, locale: "so" | "en"): string {
  const seg = locale === "so" ? "" : "/en";
  return `${SITE_URL}${seg}${href}`;
}

export async function placeMetadata(
  place: Place,
  locale: "so" | "en",
): Promise<Metadata> {
  const href = placePageHref(place.slug, locale);
  const title = placeTitle(place, locale);
  const description = placeDescription(place, locale);

  const soHref = placePageHref(place.slug, "so");
  const enHref = placePageHref(place.slug, "en");

  return {
    title,
    description,
    alternates: {
      canonical: href,
      languages: { so: soHref, en: enHref },
    },
    openGraph: {
      title,
      description,
      url: localeUrl(href, locale),
      siteName: "Qiimale",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
