import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/lib/get-payload";
import { placePageHref } from "@/lib/place-meta";
import { SITE_URL } from "@/lib/site-url";
import type { Category, City, Place } from "@/payload-types";

async function fetchAll<T>(
  collection: string,
  locale: "so" | "en",
): Promise<T[]> {
  const payload = await getPayloadClient();
  const all: T[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: collection as "places" | "cities" | "categories",
      where: { status: { equals: "approved" } } as never,
      limit: 100,
      page,
      locale,
      fallbackLocale: "so",
      overrideAccess: true,
      depth: 0,
    });
    all.push(...(result.docs as T[]));
    hasNextPage = result.hasNextPage;
    page++;
  }

  return all;
}

function sitemapUrl(
  href: string,
  langHrefs: Record<string, string>,
  lastModified: string,
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${href}`,
    lastModified: new Date(lastModified),
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages: langHrefs },
  };
}

const STATIC_ROUTES = [
  { href: "/", priority: 1.0 },
  { href: "/places", priority: 0.9 },
  { href: "/categories", priority: 0.9 },
  { href: "/cities", priority: 0.9 },
  { href: "/search", priority: 0.5 },
];

const NOW = new Date().toISOString();

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  for (const { href, priority } of STATIC_ROUTES) {
    const soHref = href;
    const enHref = href === "/" ? "/en" : `/en${href}`;
    urls.push(
      sitemapUrl(
        soHref,
        { so: `${SITE_URL}${soHref}`, en: `${SITE_URL}${enHref}` },
        NOW,
        priority,
      ),
    );
  }

  const [places, categories, cities] = await Promise.all([
    fetchAll<Place>("places", "so"),
    fetchAll<Category>("categories", "so"),
    fetchAll<City>("cities", "so"),
  ]);

  for (const place of places) {
    const soHref = placePageHref(place.slug, "so");
    const enHref = placePageHref(place.slug, "en");
    urls.push(
      sitemapUrl(
        soHref,
        {
          so: `${SITE_URL}${soHref}`,
          en: `${SITE_URL}${enHref}`,
        },
        place.updatedAt,
        0.8,
      ),
    );
  }

  for (const city of cities) {
    const soHref = `/cities/${city.slug}`;
    const enHref = `/en/cities/${city.slug}`;
    urls.push(
      sitemapUrl(
        soHref,
        {
          so: `${SITE_URL}${soHref}`,
          en: `${SITE_URL}${enHref}`,
        },
        city.updatedAt,
        0.7,
      ),
    );
  }

  for (const cat of categories) {
    const soHref = `/categories/${cat.slug}`;
    const enHref = `/en/categories/${cat.slug}`;
    urls.push(
      sitemapUrl(
        soHref,
        {
          so: `${SITE_URL}${soHref}`,
          en: `${SITE_URL}${enHref}`,
        },
        cat.updatedAt,
        0.7,
      ),
    );
  }

  return urls;
}
