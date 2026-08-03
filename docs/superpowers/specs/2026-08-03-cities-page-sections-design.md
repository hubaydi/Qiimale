# Cities Page Per-City Sections Design

Date: 2026-08-03

## Goal

Apply the same refactor done to the categories page: replace the flat city-name grid on the cities page with one section per city, each showing up to 8 places and a "View all" link. Mirrors `src/app/(frontend)/[locale]/categories/page.tsx`.

## Behavior

- Replace the flat name grid with one section per visible city (using the existing `visibleContentQuery(user)` filter):
  - `SectionHeader` = city name + "View all" link → `/cities/{slug}`.
  - For pending cities, the "Preview/Tusaale" badge is passed as the header's `action`.
  - Up to 8 visible places (approved plus the user's own pending) sorted top rated (`-ratingAvg, -reviewCount`), queried in parallel via `Promise.all`, rendered as `PlaceCard` grid.
  - Empty cities still render their header + "View all" + empty message (`Search.empty`).
- Keep the page-level header (title + "Add city" button) and the no-cities empty state (`Cities.empty`).
- `generateMetadata` unchanged.

## Files touched

- `src/app/(frontend)/[locale]/cities/page.tsx` — rework layout into per-city sections.

No changes to collections, payload config, translations, or dependencies. Reuses the shared `SectionHeader` component. The city detail page (`cities/[slug]`) is untouched.
