# Featured Category Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `e-commerce` and `e-learning` category sections to the homepage (after "Top rated places") and rework the categories page so each category renders as a section with up to 8 places and a "View all" link.

**Architecture:** Both pages are server components that query Payload (MongoDB). Homepage adds two parallel place queries filtered by category slug. Categories page keeps its existing category list query and adds one parallel place query per category (N+1, parallelized). The local `SectionHeader` component in the homepage is extracted to a shared component so the categories page reuses it.

**Tech Stack:** Next.js App Router, Payload CMS, next-intl, Tailwind, Framer Motion (`StaggerGroup`/`StaggerItem`/`Reveal`).

## Global Constraints

- Use `pnpm` for all commands.
- Reuse existing translation keys: `Home.viewAll`, `Search.empty`. No new keys.
- Follow existing query style: `overrideAccess: true`, `depth: 1` for places, `locale` + `fallbackLocale: "so"`.
- Approved-only places on homepage; categories page keeps `visibleContentQuery(user)`.
- Place sort for sections: `["-ratingAvg", "-reviewCount"]`.
- No new dependencies, no schema changes.
- Place queries per category run in parallel with `Promise.all`.
- Preserve the "Preview" badge for pending categories on the categories page.

---
### Task 1: Extract shared SectionHeader component

**Files:**
- Create: `src/components/SectionHeader.tsx`
- Modify: `src/app/(frontend)/[locale]/page.tsx:13-51` (remove local definition, import shared one)

**Interfaces:**
- Produces: `SectionHeader({ title, href?, linkLabel?, action? })` — props `{ title: string; href?: string; linkLabel?: string; action?: ReactNode }`. Renders the animated section header (accent bar + title + optional action + "View all" arrow link). Imported as `import { SectionHeader } from "@/components/SectionHeader";`.

- [ ] **Step 1: Create the shared component**

```tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";

export function SectionHeader({
  title,
  href,
  linkLabel,
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      as="div"
      className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
        <span className="inline-block h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <div
        className={`flex w-full items-center gap-2 sm:w-auto sm:justify-end ${
          action ? "justify-between" : "justify-end"
        }`}
      >
        {action}
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 group/link"
          >
            {linkLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
```

- [ ] **Step 2: Remove the local definition in the homepage**

In `src/app/(frontend)/[locale]/page.tsx` delete lines 13-51 (the `SectionHeader` function) and remove `ArrowRight` and `ReactNode` from the lucide/react imports. Update imports to add `SectionHeader`:

```tsx
import { MapPin, Plus, Search, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/SectionHeader";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { Input } from "@/components/ui/input";
import { getPayloadClient } from "@/lib/get-payload";
import { SITE_URL } from "@/lib/site-url";
import type { Category, City, Place, Review } from "@/payload-types";
```

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SectionHeader.tsx src/app/"(frontend)"/[locale]/page.tsx
git commit -m "refactor: extract shared SectionHeader component"
```

---
### Task 2: Add e-commerce and e-learning sections to homepage

**Files:**
- Modify: `src/app/(frontend)/[locale]/page.tsx`

**Interfaces:**
- Consumes: `SectionHeader` (Task 1), `PlaceCard`, `StaggerGroup`/`StaggerItem`, `t("Home.viewAll")`, `t("Search.empty")`.
- Produces: Two new `<section>` blocks after the "Top rated" section, keyed by category, titled with the localized category name, linking to `/categories/{slug}`.

- [ ] **Step 1: Add the featured queries**

In `src/app/(frontend)/[locale]/page.tsx`, inside `HomePage`, after the `topPlaces` query (before `latestPlaces`), add:

```tsx
const featuredCategorySlugs = ["e-commerce", "e-learning"];
const featuredCategories = await payload.find({
  collection: "categories",
  where: {
    and: [
      { status: { equals: "approved" } },
      { slug: { in: featuredCategorySlugs } },
    ],
  },
  limit: featuredCategorySlugs.length,
  locale,
  fallbackLocale: "so",
  overrideAccess: true,
});
const featuredBySlug = new Map(
  featuredCategories.docs.map((cat) => [cat.slug, cat]),
);
const featuredPlaces = await Promise.all(
  featuredCategorySlugs.map((slug) =>
    featuredBySlug.has(slug)
      ? payload.find({
          collection: "places",
          where: {
            and: [
              { status: { equals: "approved" } },
              { "category.slug": { equals: slug } },
            ],
          },
          limit: 8,
          sort: ["-ratingAvg", "-reviewCount"],
          overrideAccess: true,
          locale,
          fallbackLocale: "so",
          depth: 1,
        })
      : Promise.resolve({ docs: [] as Place[] }),
  ),
);
```

- [ ] **Step 2: Render the two sections**

Insert between the "Top rated" `</section>` and the "Latest places" `{/* Latest places */}` comment:

```tsx
{featuredCategorySlugs.map((slug, i) => {
  const category = featuredBySlug.get(slug);
  if (!category) return null;
  const places = featuredPlaces[i].docs;
  return (
    <section key={category.id}>
      <SectionHeader
        title={category.name}
        href={`/categories/${category.slug}`}
        linkLabel={t("Home.viewAll")}
      />
      {places.length > 0 ? (
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((p: Place) => (
            <StaggerItem key={p.id}>
              <PlaceCard place={p} locale={locale} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <p className="text-sm text-muted-foreground">{t("Search.empty")}</p>
      )}
    </section>
  );
})}
```

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/"(frontend)"/[locale]/page.tsx
git commit -m "feat: add e-commerce and e-learning sections to homepage"
```

---
### Task 3: Rework categories page into per-category sections

**Files:**
- Modify: `src/app/(frontend)/[locale]/categories/page.tsx`

**Interfaces:**
- Consumes: `SectionHeader` (Task 1), `PlaceCard`, `StaggerGroup`/`StaggerItem`, `visibleContentQuery(user)`, `t("Home.viewAll")`, `t("Search.empty")`.
- Produces: One `<section>` per category with header (name + preview badge for pending + "View all" → `/categories/{slug}`) and up to 8 places or an empty message.

- [ ] **Step 1: Rewrite the page**

Replace the entire `CategoriesPage` component (lines 33-101) with:

```tsx
export default async function CategoriesPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();
  const user = await getCurrentUser();

  const categories = await payload.find({
    collection: "categories",
    where: visibleContentQuery(user),
    limit: 100,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const categoryPlaces = await Promise.all(
    categories.docs.map((cat) =>
      payload.find({
        collection: "places",
        where: {
          and: [
            visibleContentQuery(user),
            { "category.slug": { equals: cat.slug } },
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
      href="/categories/add-category"
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift hover:bg-primary/90"
    >
      <Plus size={16} />
      {t("Nav.addCategory")}
    </Link>
  );

  if (categories.docs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">{t("Categories.empty")}</p>
        <div className="flex justify-center">{addLink}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Categories.title")}
        </h1>
        {addLink}
      </div>
      {categories.docs.map((cat, i) => {
        const places = categoryPlaces[i].docs;
        return (
          <section key={cat.id}>
            <SectionHeader
              title={cat.name}
              href={`/categories/${cat.slug}`}
              linkLabel={t("Home.viewAll")}
              action={
                cat.status === "pending" ? (
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
              <p className="text-sm text-muted-foreground">{t("Search.empty")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update imports**

Update the imports in `src/app/(frontend)/[locale]/categories/page.tsx` to:

```tsx
import { Plus } from "lucide-react";
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

- [ ] **Step 3: Verify**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Full build verification**

Run: `pnpm build`
Expected: build succeeds, all routes compile.

- [ ] **Step 5: Commit**

```bash
git add src/app/"(frontend)"/[locale]/categories/page.tsx
git commit -m "feat: show places per category on categories page"
```
