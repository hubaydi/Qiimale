# SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish complete SEO foundation: per-page metadata, hreflang alternates, dynamic sitemap, robots.txt, JSON-LD structured data, and per-place OG images.

**Architecture:** Centralized metadata derivation via `src/lib/place-meta.ts` seam (pure functions, no Next imports). Metadata, sitemap, and robots use Next.js built-in conventions. JSON-LD via a thin `<JsonLd>` React component. OG images via `ImageResponse` file conventions.

**Tech Stack:** Next.js 16.2.7, Payload 3, next-intl 4, vitest, TypeScript

## Global Constraints

- No new dependencies — everything uses existing `next`, `next-intl`, `payload`
- `localePrefix: "as-needed"`, `defaultLocale: "so"` — Somali URLs have no prefix, English URLs use `/en/` prefix
- `SITE_URL` default is `https://qiimale.com`, overridable via `NEXT_PUBLIC_SITE_URL`
- All user-facing strings go in `messages/so.json` and `messages/en.json` under a new `Seo` namespace
- Lint with `pnpm lint` (biome check), test with `pnpm test`
- Place type from `@/payload-types` (generated file at repo root `payload-types.ts`, aliased as `@/payload-types` in tsconfig)
- `generateMetadata` params are `Promise<>` in Next 16
- `sitemap.ts` function signature: `export default function sitemap(): MetadataRoute.Sitemap`
- `opengraph-image.ts` params are `Promise<>` in Next 16

---

### Task 1: Site URL config + place-meta.ts seam + tests

**Files:**
- Create: `src/lib/site-url.ts`
- Create: `src/lib/place-meta.ts`
- Create: `src/lib/place-meta.test.ts`

**Interfaces:**
- Produces: `SITE_URL` (string), `placeTitle(place: Place, locale: "so" | "en"): string`, `placeDescription(place: Place, locale: "so" | "en"): string`, `placeMetadata(place: Place, locale: "so" | "en"): Promise<Metadata>`, `placePageHref(slug: string, locale: "so" | "en"): string`

- [ ] **Step 1: Create `src/lib/site-url.ts`**

```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qiimale.com";
```

- [ ] **Step 2: Create `src/lib/place-meta.ts`**

```ts
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
```

- [ ] **Step 3: Create `src/lib/place-meta.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { placeDescription } from "./place-meta";

function makePlace(overrides: Record<string, unknown>) {
  return {
    id: "1",
    name: "Test Place",
    slug: "test-place",
    category: "cat1",
    city: "city1",
    description: null,
    ratingAvg: 4.2,
    reviewCount: 5,
    updatedAt: "2026-01-01",
    createdAt: "2026-01-01",
    status: "approved" as const,
    ...overrides,
  };
}

describe("placeDescription", () => {
  it("uses place.description when present", () => {
    const place = makePlace({ description: "A great spot" });
    expect(placeDescription(place, "so")).toBe("A great spot");
    expect(placeDescription(place, "en")).toBe("A great spot");
  });

  it("falls back to template when description is null", () => {
    const place = makePlace({ description: null });
    const en = placeDescription(place, "en");
    expect(en).toContain("4.2");
    expect(en).toContain("5 reviews");
    expect(en).toContain("on Qiimale");
  });

  it("falls back to template when description is empty string", () => {
    const place = makePlace({ description: "" });
    const so = placeDescription(place, "so");
    expect(so).toContain("4.2");
    expect(so).toContain("5");
  });
});
```

- [ ] **Step 4: Run tests to verify**

Run: `pnpm test src/lib/place-meta.test.ts`
Expected: 3 tests PASS (or appropriate assertion passes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/site-url.ts src/lib/place-meta.ts src/lib/place-meta.test.ts
git commit -m "feat: add site URL config and place-meta seam with tests"
```

---

### Task 2: Seo i18n keys

**Files:**
- Modify: `messages/so.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `Seo` namespace keys consumed by Tasks 3-6

- [ ] **Step 1: Add `Seo` namespace to `messages/so.json`**

Add after the `Errors` section, before the closing `}`:

```json
"Seo": {
  "titleSuffix": "Qiimale",
  "homeDescription": "Qiimayn goobo & adeegyo Soomaaliya",
  "placesTitle": "Goobaha — Qiimale",
  "placesDescription": "Arag dhamaan goobaha iyo adeegyada Soomaaliya ka jira.",
  "citiesTitle": "Magaalooyinka — Qiimale",
  "citiesDescription": "Raadi goobaha iyo adeegyada ku yaalla magaalooyinka Soomaaliya.",
  "categoriesTitle": "Qaybaha — Qiimale",
  "categoriesDescription": "Baar goobaha adigoo adeegsanaya noocyada kala duwan.",
  "searchTitle": "Raadi — Qiimale",
  "searchDescription": "Raadi goobaha iyo adeegyada Soomaaliya.",
  "categoryDescription": "Eeg goobaha ugu fiican ee qaybta {category}.",
  "cityDescription": "Eeg goobaha iyo adeegyada magaalada {city}.",
  "ogImageAlt": "Qiimale — Qiimayn goobo & adeegyo Soomaaliya"
}
```

- [ ] **Step 2: Add `Seo` namespace to `messages/en.json`**

Add after the `Errors` section, before the closing `}`:

```json
"Seo": {
  "titleSuffix": "Qiimale",
  "homeDescription": "Review Somali places & services",
  "placesTitle": "Places — Qiimale",
  "placesDescription": "Browse all places and services in Somalia.",
  "citiesTitle": "Cities — Qiimale",
  "citiesDescription": "Find places and services across Somali cities.",
  "categoriesTitle": "Categories — Qiimale",
  "categoriesDescription": "Browse places by category.",
  "searchTitle": "Search — Qiimale",
  "searchDescription": "Search for places and services in Somalia.",
  "categoryDescription": "View the best places in {category}.",
  "cityDescription": "Browse places and services in {city}.",
  "ogImageAlt": "Qiimale — Review Somali places & services"
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/so.json messages/en.json
git commit -m "feat: add Seo i18n namespace"
```

---

### Task 3: Root layout metadata upgrade

**Files:**
- Modify: `src/app/(frontend)/[locale]/layout.tsx`

**Interfaces:**
- Consumes: `SITE_URL` from Task 1
- Produces: Root `metadataBase`, title template, OG/Twitter defaults, hreflang alternates

- [ ] **Step 1: Upgrade `generateMetadata` in `src/app/(frontend)/[locale]/layout.tsx`**

Replace the existing `generateMetadata`:

```ts
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

// ... fonts unchanged ...

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s — Qiimale`,
      default: "Qiimale",
    },
    description: so
      ? "Qiimayn goobo & adeegyo Soomaaliya"
      : "Review Somali places & services",
    alternates: {
      canonical: so ? "/" : "/en",
      languages: { so: "/", en: "/en" },
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: "Qiimale",
      locale: so ? "so_SO" : "en_US",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

// ... layout component unchanged ...
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors in layout.tsx

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/layout.tsx
git commit -m "feat: upgrade root layout metadata with metadataBase, OG, alternates"
```

---

### Task 4: List and home page static metadata

**Files:**
- Modify: `src/app/(frontend)/[locale]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/places/page.tsx`
- Modify: `src/app/(frontend)/[locale]/cities/page.tsx`
- Modify: `src/app/(frontend)/[locale]/categories/page.tsx`
- Modify: `src/app/(frontend)/[locale]/search/page.tsx`

**Interfaces:**
- Consumes: `Seo` i18n keys from Task 2, root title template from Task 3

- [ ] **Step 1: Add `generateMetadata` to `src/app/(frontend)/[locale]/page.tsx`**

Add the import and export (keep the existing default export):

```ts
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/site-url";

// ... existing imports and SectionHeader ...

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

// ... existing HomePage default export unchanged ...
```

- [ ] **Step 2: Add `generateMetadata` to `src/app/(frontend)/[locale]/places/page.tsx`**

Add before the default export:

```ts
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// ... existing imports ...

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";
  const t = await getTranslations("Seo");

  return {
    title: t("placesTitle"),
    description: t("placesDescription"),
    alternates: {
      canonical: so ? "/places" : "/en/places",
      languages: {
        so: "/places",
        en: "/en/places",
      },
    },
  };
}

// ... existing PlacesPage default export unchanged ...
```

- [ ] **Step 3: Add `generateMetadata` to `src/app/(frontend)/[locale]/cities/page.tsx`**

Add before the default export:

```ts
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// ... existing imports ...

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

// ... existing CitiesPage default export unchanged ...
```

- [ ] **Step 4: Add `generateMetadata` to `src/app/(frontend)/[locale]/categories/page.tsx`**

Add before the default export:

```ts
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// ... existing imports ...

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";
  const t = await getTranslations("Seo");

  return {
    title: t("categoriesTitle"),
    description: t("categoriesDescription"),
    alternates: {
      canonical: so ? "/categories" : "/en/categories",
      languages: {
        so: "/categories",
        en: "/en/categories",
      },
    },
  };
}

// ... existing CategoriesPage default export unchanged ...
```

- [ ] **Step 5: Add `generateMetadata` to `src/app/(frontend)/[locale]/search/page.tsx`**

Add before the default export:

```ts
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// ... existing imports ...

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

// ... existing SearchPage default export unchanged ...
```

- [ ] **Step 6: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/page.tsx \
  src/app/\(frontend\)/\[locale\]/places/page.tsx \
  src/app/\(frontend\)/\[locale\]/cities/page.tsx \
  src/app/\(frontend\)/\[locale\]/categories/page.tsx \
  src/app/\(frontend\)/\[locale\]/search/page.tsx
git commit -m "feat: add generateMetadata to home and list pages"
```

---

### Task 5: JSON-LD component

**Files:**
- Create: `src/components/json-ld.tsx`

**Interfaces:**
- Produces: `<JsonLd data={} schema={} />` component

- [ ] **Step 1: Create `src/components/json-ld.tsx`**

```tsx
type JsonLdProps = {
  data: Record<string, unknown>;
  schema?: string;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/json-ld.tsx
git commit -m "feat: add JsonLd component"
```

---

### Task 6: Place page metadata + JSON-LD

**Files:**
- Modify: `src/app/(frontend)/[locale]/places/[slug]/page.tsx`

**Interfaces:**
- Consumes: `placeMetadata` from Task 1, `<JsonLd>` from Task 5, `mediaUrl` from existing `@/lib/media`, `SITE_URL` from Task 1

- [ ] **Step 1: Add `generateMetadata` and JSON-LD to place page**

Replace the top of the file to add new imports and `generateMetadata`, then add JSON-LD scripts at the bottom of the JSX before `</div>`.

Add imports (merge with existing):

```ts
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, MapPin, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion";
import { JsonLd } from "@/components/json-ld";
import { PlaceReviews } from "@/components/PlaceReviews";
import { ReviewCard } from "@/components/ReviewCard";
import { StarRating } from "@/components/StarRating";
import { getPayloadClient } from "@/lib/get-payload";
import { type MediaField, mediaAlt, mediaUrl } from "@/lib/media";
import { placeMetadata } from "@/lib/place-meta";
import { SITE_URL } from "@/lib/site-url";
import { normalizeUrl } from "@/lib/url";
import type { Place, Review, Media } from "@/payload-types";
```

Add `generateMetadata` before the default export:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "places",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale: locale as "so" | "en",
    fallbackLocale: "so",
  });

  const place = found.docs[0] as Place | undefined;
  if (!place || place.status !== "approved") return {};

  return placeMetadata(place, locale as "so" | "en");
}
```

At the bottom of the returned JSX, add JSON-LD scripts just before the closing `</div>` (after the `<PlaceReviews>` block, before `</div>`). Add a helper block after the existing JSX:

Insert after the `</PlaceReviews>` closing tag and before `</div>` (the outer wrapper):

```tsx
        {/* JSON-LD Structured Data */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: place.name,
            description: place.description || undefined,
            ...(imageUrl ? { image: `${SITE_URL}${imageUrl}` } : {}),
            ...(city
              ? {
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: city.name,
                    ...(place.address
                      ? { streetAddress: place.address }
                      : {}),
                  },
                }
              : {}),
            url: `${SITE_URL}/places/${place.slug}`,
            ...(totalReviews > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: place.ratingAvg?.toFixed(1) ?? "0",
                    reviewCount: totalReviews,
                  },
                }
              : {}),
          }}
        />
        {reviewDocs.slice(0, 10).map((r) => {
          let authorName = "Anonymous";
          if (typeof r.author === "object" && r.author !== null) {
            const u = r.author as { name?: string };
            if (u.name) authorName = u.name;
          }
          return (
            <JsonLd
              key={r.id}
              data={{
                "@context": "https://schema.org",
                "@type": "Review",
                itemReviewed: {
                  "@type": "LocalBusiness",
                  name: place.name,
                },
                author: { "@type": "Person", name: authorName },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: r.rating.toString(),
                },
                datePublished: r.createdAt,
              }}
            />
          );
        })}
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/places/\[slug\]/page.tsx
git commit -m "feat: add generateMetadata and JSON-LD structured data to place pages"
```

---

### Task 7: Cities and categories metadata fixes

**Files:**
- Modify: `src/app/(frontend)/[locale]/cities/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/categories/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Seo` i18n keys from Task 2

- [ ] **Step 1: Fix `cities/[slug]` metadata — localize strings, add notFound() guard, add alternates**

Replace the existing `generateMetadata` in `src/app/(frontend)/[locale]/cities/[slug]/page.tsx`:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = rawLocale as "so" | "en";
  const t = await getTranslations("Seo");
  const so = locale === "so";

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
  if (!city) return {};

  const title = so
    ? `${city.name} — Qiimaynta ganacsiyada kuyaalla Magaalada ${city.name}`
    : `${city.name} — Reviews — Qiimale`;

  return {
    title,
    description: t("cityDescription", { city: city.name }),
    alternates: {
      canonical: so ? `/cities/${slug}` : `/en/cities/${slug}`,
      languages: {
        so: `/cities/${slug}`,
        en: `/en/cities/${slug}`,
      },
    },
  };
}
```

Also add `notFound()` in the component body after the city fetch. Replace:

```ts
const city = result.docs[0] as City | undefined;
if (!city) notFound();
```

(The body already has this pattern but only on the second query — the `generateMetadata` query is a separate one. The component body already checks `if (!city) notFound()` after its own fetch — verify it's present or add it.)

Verify the component body has the guard:

```ts
const city = result.docs[0] as City | undefined;
if (!city) notFound();
```

- [ ] **Step 2: Fix `categories/[slug]` metadata — localize strings, add alternates**

Replace the existing `generateMetadata` in `src/app/(frontend)/[locale]/categories/[slug]/page.tsx`:

```ts
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
```

- [ ] **Step 3: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/cities/\[slug\]/page.tsx \
  src/app/\(frontend\)/\[locale\]/categories/\[slug\]/page.tsx
git commit -m "fix: localize cities/categories metadata, add alternates, guard missing city"
```

---

### Task 8: Sitemap

**Files:**
- Create: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `SITE_URL` from Task 1, `placePageHref` from Task 1

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/lib/get-payload";
import { placePageHref } from "@/lib/place-meta";
import { SITE_URL } from "@/lib/site-url";
import type { Place, City, Category } from "@/payload-types";

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
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add dynamic sitemap with hreflang alternates"
```

---

### Task 9: Robots

**Files:**
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: `SITE_URL` from Task 1

- [ ] **Step 1: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/oauth",
          "/account",
          "/login",
          "/register",
          "/verify",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt with sitemap reference"
```

---

### Task 10: Root default OG image route

**Files:**
- Create: `src/app/opengraph-image.ts`

**Interfaces:**
- Produces: Root OG image auto-inherited by all routes without their own

- [ ] **Step 1: Create `src/app/opengraph-image.ts`**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, oklch(0.45 0.24 262) 0%, oklch(0.546 0.222 258) 45%, oklch(0.48 0.2 270) 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            marginBottom: 16,
          }}
        >
          Qiimale
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.8,
          }}
        >
          Review Somali places & services
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/opengraph-image.ts
git commit -m "feat: add root default OG image route"
```

---

### Task 11: Per-place OG image route

**Files:**
- Create: `src/app/(frontend)/[locale]/places/[slug]/opengraph-image.ts`

**Interfaces:**
- Consumes: `mediaUrl` from `@/lib/media`, Payload place query

- [ ] **Step 1: Create the OG image route**

```tsx
import { ImageResponse } from "next/og";
import { getPayloadClient } from "@/lib/get-payload";
import { type MediaField, mediaUrl } from "@/lib/media";
import type { Place, City, Category } from "@/payload-types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return [
    {
      id: slug,
      size,
      contentType,
      alt: "Qiimale place page",
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "places",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale: locale as "so" | "en",
    fallbackLocale: "so",
  });

  const place = found.docs[0] as Place | undefined;

  const name = place?.name ?? "Qiimale";
  const rating = place?.ratingAvg?.toFixed(1) ?? null;
  const reviewCount = place?.reviewCount ?? null;

  const category =
    typeof place?.category === "object" && place.category !== null
      ? (place.category as Category)
      : null;

  const city =
    typeof place?.city === "object" && place.city !== null
      ? (place.city as City)
      : null;

  const imageUrl = place?.image
    ? mediaUrl(place.image as MediaField, "card")
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            imageUrl
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${imageUrl})`
              : "linear-gradient(135deg, oklch(0.45 0.24 262) 0%, oklch(0.546 0.222 258) 45%, oklch(0.48 0.2 270) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            marginBottom: 24,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>

        {rating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 36,
              marginBottom: 16,
            }}
          >
            <span>★ {rating}</span>
            {reviewCount ? (
              <span style={{ opacity: 0.7 }}>
                ({reviewCount} reviews)
              </span>
            ) : null}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 28,
            opacity: 0.8,
          }}
        >
          {category?.name && <span>{category.name}</span>}
          {city?.name && <span>{city.name}</span>}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 24,
            opacity: 0.5,
          }}
        >
          Qiimale
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Lint to verify**

Run: `pnpm lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/places/\[slug\]/opengraph-image.ts
git commit -m "feat: add per-place OG image route"
```

---

### Task 12: Final verification — full build

**Files:** (none, verification only)

- [ ] **Step 1: Run tests**

Run: `pnpm test`
Expected: all tests pass, including place-meta.test.ts

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: build succeeds (catches type errors, confirms metadata/sitemap/robots/OG routes compile)

- [ ] **Step 3: Lint full codebase**

Run: `pnpm lint`
Expected: no errors

