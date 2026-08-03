# SEO Improvements — Design Spec

**Date:** 2026-08-03
**Project:** Qiimale (Next.js 16 + Payload 3 + next-intl, bilingual `so`/`en`)
**Status:** Approved, ready for implementation plan

## Context

Qiimale is a Somali places/services review site (a Yelp for Somalia). SEO is the primary growth channel for a directory site, but the current SEO state is minimal:

- Root metadata only in `[locale]/layout.tsx` — hard-coded title/description, no `metadataBase`, no OpenGraph/Twitter, no canonical, no hreflang alternates.
- `generateMetadata` exists on `categories/[slug]` and `cities/[slug]` but strings are hard-coded in Somali (wrong on the English locale), and `cities/[slug]` renders "undefined" when the city is missing.
- `places/[slug]` — the money pages — have **no `generateMetadata` at all**.
- No `sitemap.ts`, no `robots.ts`.
- No structured data (JSON-LD).
- No OG/social preview images; no `metadataBase`.
- `localeDetection: false` is good for SEO, but with no hreflang the bilingual setup is invisible to search engines.

## Goal

Establish the complete SEO foundation search engines need to properly index and rank Qiimale: per-page metadata, hreflang for the bilingual setup, dynamic sitemap, robots, JSON-LD structured data, and per-place OG images.

## Approach

**Approach C — Derive now, reserve a seam for overrides later.**

Place metadata is computed from existing fields (`name`, `description`, `city.name`, `category.name`, `ratingAvg`, `reviewCount`). No schema changes. Metadata derivation is centralized in `src/lib/place-meta.ts` so adding override fields later is a one-file change, not a refactor.

Rejected alternatives:
- **Approach A (derive, no seam)** — same speed but harder to extend later.
- **Approach B (SEO field group on Places)** — speculative admin UI no one will fill for months; adds maintenance surface for a feature that may never be used at scale.

## Scope

### In scope (15 deliverables)

1. **`metadataBase` + site URL config** — central `SITE_URL` constant (defaulting to `https://qiimale.com`, configurable via `NEXT_PUBLIC_SITE_URL`), set as `metadataBase` in root layout.
2. **Root metadata upgrade** (`[locale]/layout.tsx`) — title template, defaults for OG/Twitter, canonical, hreflang alternates for `so`/`en`.
3. **Per-page metadata:**
   - `places/[slug]` — full `generateMetadata` (title, description, canonical, OG, Twitter, alternates).
   - `cities/[slug]` — localize + fix the `undefined` bug when city is missing.
   - `categories/[slug]` — localize strings per locale.
   - List pages (`/places`, `/cities`, `/categories`, `/search`) — add static metadata.
4. **`src/lib/place-meta.ts`** — the seam. Pure functions deriving place metadata. One file to change later if overrides are added.
5. **`src/app/sitemap.ts`** — dynamic sitemap with hreflang `alternates` per URL.
6. **`src/app/robots.ts`** — allow all, link to sitemap, disallow private/auth routes.
7. **JSON-LD on place pages** — `LocalBusiness` + `AggregateRating`, and per-`Review` markup.
8. **Dynamic OG image route** `src/app/(frontend)/[locale]/places/[slug]/opengraph-image.ts` — `ImageResponse` rendering place name, rating, category, city.
9. **Default OG route** `src/app/opengraph-image.ts` — brand gradient + site name, auto-inherited by every non-place route. (No static `/public/og-default.png` file — the root route replaces it.)
10. **`src/lib/place-meta.test.ts`** — one vitest self-check.

### Out of scope

- SEO override fields on `Places` (reserved seam only).
- Schema migrations.
- Keyword/content strategy.
- Link-building.
- Analytics / Search Console verification (suggest separately).

## URL strategy

The site uses `next-intl` with `localePrefix: "as-needed"` and `defaultLocale: "so"`:

- `so` (default locale) URLs: **no prefix** — `/places/foo`, `/cities/bar`.
- `en` URLs: `/en/places/foo`, `/en/cities/bar`.

Sitemap and hreflang must reflect this asymmetry. `alternates.languages` map: `so -> /places/foo`, `en -> /en/places/foo`. Default-locale URLs must avoid redirect chains.

Production domain: **`https://qiimale.com`** (configurable via `NEXT_PUBLIC_SITE_URL`).

## Architecture — the seam

### `src/lib/place-meta.ts`

Pure functions, no Next imports. Easy to unit-test, easy to extend with overrides later.

```ts
export function placeTitle(place, locale): string
export function placeDescription(place, locale): string
export function placeMetadata(place, locale): Promise<Metadata>  // composes the above + OG + alternates
```

**Derivation rules:**

| Field | Source | Fallback (when empty) |
|---|---|---|
| title | `{name} — Qiimale` (`{name} Qiimayn — Qiimale` for `so`) | always present (name is required) |
| description | `place.description` if set | templated: `"{name} in {city} — {ratingAvg}★ from {reviewCount} reviews on Qiimale"` (localized) |
| OG image | `opengraph-image.ts` route (auto-detected by Next from file convention) | root `opengraph-image.ts` route |
| canonical | full URL based on slug + localePrefix rules | n/a |
| alternates | `so` + `en` URLs | n/a |

`place.city` and `place.category` are already populated (`depth: 1`) in the place page query. The seam works on the existing `Place` type from `payload-types.ts`.

**Extensibility (the "C" in Approach C):** the file exports an internal `derivePlaceMeta(place, locale)` that the public functions wrap. Adding a `seoMeta` field group to `Places.ts` later means one change here — read `place.seoMeta?.title ?? derivedTitle` — and every caller automatically picks it up. No refactor anywhere else.

**i18n for fallback strings:** use the existing `getTranslations` from `next-intl/server`, new keys under a `Seo` namespace in `messages/{so,en}.json`. Keeps the i18n pattern the codebase already uses.

**Testing:** one vitest test in `src/lib/place-meta.test.ts`. `placeDescription` falls back correctly when `description` is empty, and emits the localized template otherwise. Trivial assertions, no fixtures.

## Per-page metadata

### Template strings (localized via next-intl `Seo` namespace)

| Page | Title (so) | Title (en) | Description |
|---|---|---|---|
| Home | `Qiimale` | `Qiimale — Somalia Reviews` | from existing `App.tagline` |
| Place | `{name} — Qiimayn Qiimale` | `{name} — Reviews — Qiimale` | `placeDescription()` |
| Category | `{name} — Qiimale` | `{name} — Reviews — Qiimale` | localized `Eeg goobaha…` |
| City | `{name} — Qiimayn ganacsiyada {name}` | `{name} — Reviews — Qiimale` | localized |
| Lists | `Goobaha — Qiimale` | `Places — Qiimale` | localized short string |
| Search | `Raadi — Qiimale` | `Search — Qiimale` | localized |

### `cities/[slug]` bug fix

Guard with `if (!city) notFound()` before building metadata strings, consistent with the place page pattern. Currently `city?.name` inside a template renders "undefined" when the doc is missing.

### Root layout metadata upgrade

```ts
metadataBase: new URL(SITE_URL),
title: { template: "%s — Qiimale", default: "Qiimale" },
alternates: { canonical: "/", languages: { so: "/", en: "/en" } },
openGraph: { type: "website", siteName: "Qiimale", locale: locale === "so" ? "so_SO" : "en_US", images: [{ url: "/opengraph-image" }] },
twitter: { card: "summary_large_image" },
robots: { index: true, follow: true },
```

### Per-page alternates (asymmetric locale prefix)

Place page at `/places/foo` (locale `so`):
```ts
alternates: { canonical: "/places/foo", languages: { so: "/places/foo", en: "/en/places/foo" } }
```

Mirror for `en` URL at `/en/places/foo`: canonical is `/en/places/foo`, `languages` map points back to both. Same pattern for `cities`, `categories`, list pages.

### OG image on place pages

Next's file convention `opengraph-image.ts` in the place route segment auto-wires `<meta>` tags — no manual OG URL needed. Other pages inherit the root default OG route.

## Sitemap

### `src/app/sitemap.ts`

One dynamic sitemap at the root (Next convention, served at `/sitemap.xml`):

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap>
```

**Entries (locale-aware, with hreflang via `alternates.languages`):**
- Static: home (so/en), `/places`, `/cities`, `/categories`, `/search`.
- Dynamic: every approved `Place` → `/places/{slug}` (so) + `/en/places/{slug}` (en).
- Dynamic: every approved `City` → `/cities/{slug}` + `/en/cities/{slug}`.
- Dynamic: every approved `Category` → `/categories/{slug}` + `/en/categories/{slug}`.

**`alternates` per URL** (Google's hreflang via sitemap):
```ts
{
  url: "https://qiimale.com/places/foo",
  alternates: { languages: { so: "https://qiimale.com/places/foo", en: "https://qiimale.com/en/places/foo" } },
  lastModified: place.updatedAt,
  changeFrequency: "weekly",
  priority: 0.8,
}
```

**Queries:** one `payload.find` per dynamic collection, paginated (`limit: 100`, loop `hasNextPage`). Pass `overrideAccess: true`, `where: status equals approved`. No depth (we only need slugs + `updatedAt`) — keeps the sitemap build cheap.

**Caching:** `export const revalidate = 3600` (regenerate hourly).

## Robots

### `src/app/robots.ts`

```ts
{
  rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/oauth", "/account", "/login", "/register", "/verify", "/verify-email", "/forgot-password", "/reset-password"] }],
  sitemap: "https://qiimale.com/sitemap.xml",
  host: "https://qiimale.com",
}
```

Auth-only routes are disallowed — they're not for indexation and Google shouldn't rank login pages.

## JSON-LD structured data

On place pages only (the money pages with reviews). Two scripts, both in a `<script type="application/ld+json">` tag.

### `LocalBusiness` + `AggregateRating` (one per place page)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Place name",
  "description": "derived description",
  "image": "absolute place image URL if present",
  "address": { "@type": "PostalAddress", "addressLocality": "city.name", "streetAddress": "place.address" },
  "url": "absolute canonical URL",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": 12
  }
}
```

Only emit `aggregateRating` when `reviewCount > 0` (Google penalizes fake-looking single-review aggregates). Only emit `address` if place has an address. Only emit `image` if there's a media upload.

### `Review` items (one `<script>` per published review, capped at first 10 to avoid bloat)

```ts
{
  "@context": "https://schema.org",
  "@type": "Review",
  "itemReviewed": { "@type": "LocalBusiness", "name": "Place name" },
  "author": { "@type": "Person", "name": "reviewer name" },
  "reviewRating": { "@type": "Rating", "ratingValue": "5" },
  "datePublished": "2026-01-15"
}
```

### Implementation

One `<JsonLd>` React component in `src/components/json-ld.tsx` that takes data + a schema type and renders the script tag (via `dangerouslySetInnerHTML`, the standard pattern). Place page composes one `LocalBusiness` + maps reviews to `<JsonLd>` items. Keeps JSON-LD out of the page's JSX.

**No collection changes.** All fields used (`name`, `description`, `address`, `image`, `city.name`, `ratingAvg`, `reviewCount`, reviews) already exist on the place page query.

**Safety:** use `JSON.stringify` only — no manual string templating (avoids JSON injection). Skip `author.name` if empty (Payload `Reviews` might allow anonymous).

## Dynamic OG image routes

### `src/app/(frontend)/[locale]/places/[slug]/opengraph-image.ts`

Next's file convention — exporting `ImageResponse` auto-wires `<meta og:image>` for that segment, no manual wiring needed.

**Content:** place name (large), rating (`★ 4.5` + review count), category name, city name, over the brand gradient. If the place has an image, composite it as a blurred/darkened background; else use the same gradient as the hero.

**Size:** `1200×630` (OG standard), `alt` from `mediaAlt()`.

```ts
export const alt = "..."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }) {
  const place = await fetchPlace(params)
  return new ImageResponse(<div>...</div>, { ...size })
}
```

**Caching:** `export const revalidate = 3600` — same as place page. For the most-visited places, Next's static generation picks these up at build; long-tail places regenerate hourly on first hit then serve cached.

**Renderer:** inline Tailwind via `tw` prop — `ImageResponse` supports a subset of CSS (flexbox, grid, linear-gradient, padding). No external font fetch (slow + flaky in edge build); use system fonts. Pure-inline-CSS — no shared component reuse, this is a one-file JSX template.

### `src/app/opengraph-image.ts` (root default)

Renders the same brand gradient + site name via `ImageResponse`. Auto-inherited by every route without its own OG. One route, no file asset needed.

**Final OG image setup:**
- `src/app/opengraph-image.ts` — root default (brand gradient + site name). Auto-inherited by every route without its own.
- `src/app/(frontend)/[locale]/places/[slug]/opengraph-image.ts` — per-place OG.

## File map

### New files

| File | Purpose |
|---|---|
| `src/lib/place-meta.ts` | The seam: pure metadata derivation functions |
| `src/lib/place-meta.test.ts` | One vitest self-check (fallback behavior) |
| `src/app/sitemap.ts` | Dynamic sitemap with hreflang alternates |
| `src/app/robots.ts` | robots.txt |
| `src/app/opengraph-image.ts` | Root default OG (brand) |
| `src/app/(frontend)/[locale]/places/[slug]/opengraph-image.ts` | Per-place OG |
| `src/components/json-ld.tsx` | `<JsonLd data={} />` component |

### Modified files

| File | Change |
|---|---|
| `src/app/(frontend)/[locale]/layout.tsx` | Upgrade `generateMetadata`: `metadataBase`, title template, OG/Twitter defaults, hreflang alternates |
| `src/app/(frontend)/[locale]/page.tsx` | Add `generateMetadata` with home-specific alternates |
| `src/app/(frontend)/[locale]/places/[slug]/page.tsx` | Add `generateMetadata`, render JSON-LD (`LocalBusiness` + `Review`s) |
| `src/app/(frontend)/[locale]/places/page.tsx` | Add static metadata |
| `src/app/(frontend)/[locale]/cities/[slug]/page.tsx` | Localize strings, fix `undefined` bug |
| `src/app/(frontend)/[locale]/cities/page.tsx` | Add static metadata |
| `src/app/(frontend)/[locale]/categories/[slug]/page.tsx` | Localize strings, add alternates |
| `src/app/(frontend)/[locale]/categories/page.tsx` | Add static metadata |
| `src/app/(frontend)/[locale]/search/page.tsx` | Add static metadata |
| `messages/so.json` | Add `Seo` namespace keys |
| `messages/en.json` | Add `Seo` namespace keys |

## Build order

1. Site URL config + `place-meta.ts` seam + tests (foundation, no UI).
2. Root layout metadata upgrade + `Seo` i18n keys + list/static page metadata.
3. Place page metadata + JSON-LD component + render on place page.
4. Cities/categories metadata fixes.
5. `sitemap.ts` + `robots.ts`.
6. OG image routes (root default + per-place).

## Verification

- `pnpm lint` (biome check) — all touched files clean.
- `pnpm test src/lib/place-meta.test.ts` — seam self-check passes.
- `pnpm build` — full build passes (catches type errors, confirms metadata/sitemap/robots/OG routes compile at build-time).
- Manual smoke check: hit `/sitemap.xml`, `/robots.txt`, a place URL, view-source for `<meta>` tags + `<script type="application/ld+json">`.

## Dependencies

No new dependencies. All features use Next.js built-ins (`MetadataRoute`, `ImageResponse`, metadata file conventions) + existing `next-intl` + existing Payload queries.