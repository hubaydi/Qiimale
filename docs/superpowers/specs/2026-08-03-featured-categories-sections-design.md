# Featured Category Sections Design

Date: 2026-08-03

## Goal

1. Add two homepage sections — one for the `e-commerce` category and one for the `e-learning` category — matching the look of the existing homepage sections (header + place grid + "View all" link).
2. Rework the categories page so it no longer renders a flat grid of category-name cards. Instead, each category renders a section (name header + "View all" link + up to 8 places), same layout as the homepage sections.

Both `e-commerce` (12 approved places) and `e-learning` (6 approved places) categories already exist and are approved in the CMS. No schema changes are needed.

## Behavior

### Homepage

- Query approved categories with `slug: { in: ["e-commerce", "e-learning"] }`.
- For each found category, fetch up to 8 approved places sorted by `-ratingAvg, -reviewCount` (top rated first), in parallel with `Promise.all`.
- Render one section per category **right after the "Top rated places" section**, using the existing `SectionHeader` component:
  - Title = localized category name.
  - "View all" link → `/categories/{slug}`.
  - Place grid of `PlaceCard`s (same grid as "Top rated": `sm:grid-cols-2 lg:grid-cols-3`).
  - If the category has no places, show the existing empty message (`t("Search.empty")`).
- If a category is missing entirely, skip its section.

### Categories page

- Keep the page header (title + "Add category" button).
- Replace the flat name grid with one section per visible category (using the existing `visibleContentQuery(user)` filter):
  - Section header = category name + "View all" link → `/categories/{slug}`.
  - Up to 8 visible places (per `visibleContentQuery(user)`, i.e. approved plus the user's own pending) sorted top rated, in parallel via `Promise.all`.
  - Empty categories still render their header + "View all" + empty message.
- Reuse existing translation keys: `Home.viewAll`, `Search.empty`. No new translations.

## Components / files touched

- `src/app/(frontend)/[locale]/page.tsx` — add two featured sections.
- `src/app/(frontend)/[locale]/categories/page.tsx` — rework layout into per-category sections.

No changes to collections, payload config, or data. No new dependencies.

## Performance note

Categories page does one place query per category (N+1), run in parallel. Fine at current scale (5 categories); revisit if the category count grows large.
