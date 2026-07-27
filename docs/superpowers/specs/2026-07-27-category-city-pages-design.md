# Category & City Pages

## Routes

| Route | File | Content |
|---|---|---|
| `/[locale]/categories` | `categories/page.tsx` | Grid of all category cards (icon + name), links to category detail |
| `/[locale]/categories/[slug]` | `categories/[slug]/page.tsx` | Header (name, icon) + paginated place list via `PlaceCard` |
| `/[locale]/cities` | `cities/page.tsx` | Grid/list of all cities (name + count?), links to city detail |
| `/[locale]/cities/[slug]` | `cities/[slug]/page.tsx` | Header (name) + paginated place list via `PlaceCard` |

## Data Fetching

- Use `getPayloadClient()` directly (server component pattern, same as home/search)
- Query categories/cities with `locale` + `fallbackLocale: "so"`
- Query places filtered by `category.slug` or `city.slug` with `status: "approved"` + `depth: 1`
- `overrideAccess: true` since these are public pages
- Sort: `-ratingAvg` for default view

## Components

- Reuse `PlaceCard` component (no changes needed)
- Category grid card: mirror the home page category card pattern
- City card: simpler version (just name, no icon)

## Navigation Updates

- Home page category grid links: `/search?category={slug}` → `/categories/{slug}`
- Footer: "Categories" link → `/categories`

## i18n

Add keys to `messages/en.json` and `messages/so.json`:
- `Categories.title` / `Cities.title`
- `Categories.empty` / `Cities.empty`
- `Cities.citiesInCity` (for header like "Places in Mogadishu")

## Metadata

Generate dynamic metadata per page:
- Category detail: "{Category name} — Qiimale"
- City detail: "Places in {City name} — Qiimale"

## No New Dependencies

All data and components already exist. Pure routing + composition.
