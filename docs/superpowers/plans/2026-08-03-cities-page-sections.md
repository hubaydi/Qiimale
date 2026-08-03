# Cities Page Per-City Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cities page's flat city-name grid with one section per city (header + "View all" link + up to 8 places), mirroring the categories page refactor.

**Architecture:** Single server component page (`src/app/(frontend)/[locale]/cities/page.tsx`). Keeps its existing city list query (`visibleContentQuery(user)`, `limit: 100`), adds one parallel places query per city via `Promise.all` (N+1, parallelized), and renders each city as a `<section>` using the shared `SectionHeader` component and `PlaceCard`s.

**Tech Stack:** Next.js App Router, Payload CMS, next-intl, Tailwind, Framer Motion (`StaggerGroup`/`StaggerItem`).

## Global Constraints

- Use `pnpm` for all commands.
- Reuse existing translation keys: `Home.viewAll`, `Search.empty`, `Nav.addCity`, `Cities.title`, `Cities.empty`. No new keys.
- Cities page keeps `visibleContentQuery(user)` for the city list and each city's places query.
- Place query: `limit: 8`, `sort: ["-ratingAvg", "-reviewCount"]`, `overrideAccess: true`, `depth: 1`, `locale` + `fallbackLocale: "so"`.
- Per-city place queries run in parallel with `Promise.all`.
- One `<section>` per city: `SectionHeader` with title = city name, "View all" → `/cities/{slug}`, and for pending cities a preview badge (`{locale === "so" ? "Tusaale" : "Preview"}`) as the header's `action`. Empty cities render the `Search.empty` message.
- Keep the page-level header (title + "Add city" button) and the no-cities empty branch with `Cities.empty`.
- `generateMetadata` unchanged.
- No schema changes, no new dependencies.

---
### Task 1: Rework cities page into per-city sections

**Files:**
- Modify: `src/app/(frontend)/[locale]/cities/page.tsx`

**Interfaces:**
- Consumes: `SectionHeader` from `@/components/SectionHeader` (`{ title: string; href?: string; linkLabel?: string; action?: ReactNode }`), `PlaceCard` (`{ place: Place; locale?: string }`), `StaggerGroup`/`StaggerItem` from `@/components/motion`, `visibleContentQuery(user)`, `t("Home.viewAll")`, `t("Search.empty")`.
- Produces: One `<section>` per city with header (name + preview badge for pending + "View all" → `/cities/{slug}`) and up to 8 places or the empty message.

- [ ] **Step 1: Replace the component**

Replace the entire `CitiesPage` component (currently lines 33-100) with:

```tsx
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

  const cityPlaces = await Promise.all(
    cities.docs.map((city) =>
      payload.find({
        collection: "places",
        where: {
          and: [
            visibleContentQuery(user),
            { "city.slug": { equals: city.slug } },
          ],
        },
        limit: 8,
        sort: ["-ratingAvg", "-reviewCount"],
        overrideAccess: true,
        depth: 1,
        locale,
        fallbackLocale: "so",
      }),
    ),
  );

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
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Cities.title")}
        </h1>
        {addLink}
      </div>
      {cities.docs.map((city, i) => {
        const places = cityPlaces[i].docs;
        return (
          <section key={city.id}>
            <SectionHeader
              title={city.name}
              href={`/cities/${city.slug}`}
              linkLabel={t("Home.viewAll")}
              action={
                city.status === "pending" ? (
                  <span className="rounded-full bg-rating/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-rating">
                    {locale === "so" ? "Tusaale" : "Preview"}
                  </span>
                ) : undefined
              }
            />
            {places.length > 0 ? (
              <StaggerGroup className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {places.map((p: Place) => (
                  <StaggerItem key={p.id}>
                    <PlaceCard place={p} locale={locale} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("Search.empty")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update imports**

Replace the imports in `src/app/(frontend)/[locale]/cities/page.tsx` with:

```tsx
import * as Icons from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/SectionHeader";
import { StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { getPayloadClient } from "@/lib/get-payload";
import { visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { Place } from "@/payload-types";
```

Note: `City` type import is no longer needed (the city objects are typed from the payload result). `* as Icons` is retained because `Icons.MapPin`/`Icons.Plus`/`Icons.SearchX` are referenced via the namespace elsewhere in the file (the page header addLink uses `Icons.Plus`; `generateMetadata` is unchanged but still imports only what it needs). If `pnpm lint` flags an unused import, remove it.

- [ ] **Step 3: Verify lint and typecheck**

Run: `pnpm lint`
Expected: no errors.

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Full build verification**

Run: `pnpm build`
Expected: build succeeds, all routes compile.

- [ ] **Step 5: Commit**

```bash
git add src/app/"(frontend)"/[locale]/cities/page.tsx
git commit -m "feat: show places per city on cities page"
```
