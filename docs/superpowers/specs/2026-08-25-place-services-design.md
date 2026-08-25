# Place Services — Multiple Services Per Place

Date: 2026-08-25

## Problem

A `Place` currently links to a single `Category`. But most businesses offer
several distinct services (e.g. a barbershop does haircuts *and* shaves), so a
single category doesn't capture what a customer actually experienced. Users
should be able to attach multiple services to a place, and reviewers should
target a specific service so reviews group under that service's section.

## Design

### Data model

**New `Services` collection** (`src/collections/Services.ts`), mirroring
`Categories`:

- `name` — text, required, localized
- `slug` — `slugField({ useAsSlug: "name", position: "sidebar" })`
- `description` — textarea, optional, localized
- `status` — select `pending`/`approved`/`rejected`, default `pending`, sidebar
- `submittedBy` — relationship → `users`, readOnly, sidebar
- access: `isAdmin` for read/create/update/delete + `isAdminAccess` for `admin`
  (panel only), like `Categories`. Frontend users create services via a server
  action with `overrideAccess: true`.

**`Places`** — add:

- `services` — relationship → `services`, `hasMany: true`, optional. No
  re-approval of the place when changed.

**`Reviews`** — add:

- `service` — relationship → `services`, optional, `index: true`.

### Visibility rules (`src/lib/services-logic.ts`)

- `canViewService(service, user)` — same shape as `canViewOwnPending`:
  `approved` → everyone; `pending` → service owner (`submittedBy`) + admin
  only; `rejected` → nobody.
- A review is *visible* if it is `published` **and** it has no `service`, or
  its `service` is approved, or the viewer is that service's owner/admin.
- `visibleServicesQuery(user)` — mirrors `visibleContentQuery`, used to list a
  place's services on the place page (approved + the viewer's own pending).

### Server actions

- `createServiceForPlace({ placeId, name, description })` — any **verified**
  user (same `user._verified` gate as `createCategory`). Creates a `pending`
  service (`submittedBy` = user) and appends it to `place.services`.
- `addServiceToPlace({ placeId, serviceId })` — **admin only**. Attaches an
  existing (approved) service to a place.
- `removeServiceFromPlace({ placeId, serviceId })` — **admin only**. Detaches a
  service from a place.
- `submitReview` — accepts an optional `serviceId`; validates the service is on
  the place and visible to the user before storing `service`. The "existing
  review" lookup narrows from place+author to **place+author+target** (target =
  a specific service, or no service for the overall review), so a user can hold
  one review per target — an overall review plus one per service — each
  submitted one at a time.

### UI

- **Add-place wizard** — new `StepServicesSelect` step (reusing the
  `CreateModal`/`StepCategorySelect` patterns): multi-select approved services,
  plus inline "create service". Services remain optional; the place can have
  zero (legacy places).
- **Place page, services list** — directly under the place description, a
  vertical list of just the service names the place offers (the services that
  are visible to the viewer). Below that, the review form and reviews.
- **Place page, reviews** — a tabbed panel instead of a flat list. Tabs:
  "Overall" (reviews with no service) + one tab per service. Each tab shows
  that target's rating avg + review count header, then its reviews with the
  existing recent/top/high/low sort. Default tab is Overall; tabs collapse to a
  scrollable pill row on narrow screens. The rating-breakdown sidebar (5→1)
  reflects the active tab.
- **Place page, manage services** — a logged-in user sees an "add service"
  control (creates a pending service); admins can also attach existing services
  and remove them.
- **ReviewForm** — a star row per target: one "Overall" row plus one row per
  visible service. Clicking stars on a row selects that target and sets its
  rating, then reveals the comment box with a message like "You selected 4
  stars for Haircut. Now leave a review for this service." One submit creates
  or updates a single review for the selected target. Pre-fill restores the
  viewer's existing review for that target (its stars + text); photos stay
  shared across targets.

### Stats

- Place `ratingAvg`/`reviewCount` recomputed from **visible** reviews only
  (exclude reviews on pending services). `recomputePlaceStats` filters reviews
  whose `service` is pending; a new `Services` `afterChange` hook re-triggers
  recompute for places that have reviews on that service (when it flips to/from
  approved).
- Per-service avg + count are computed on-the-fly by grouping visible reviews
  by service. No denormalized field.

### Testing

- `src/lib/services-logic.test.ts` — vitest, mirroring
  `src/lib/places-logic.test.ts`: `canViewService` (approved/pending/rejected ×
  owner/admin/stranger), review visibility, `visibleServicesQuery`.

## Files touched

- `src/collections/Services.ts` — new collection.
- `src/collections/index.ts` — register `Services`.
- `src/collections/Places.ts` — add `services` field.
- `src/collections/Reviews.ts` — add `service` field.
- `src/actions/services.ts` — new actions (`createServiceForPlace`,
  `addServiceToPlace`, `removeServiceFromPlace`).
- `src/actions/reviews.ts` — accept `serviceId`.
- `src/actions/places.ts` — accept `serviceIds` on `addPlace`.
- `src/lib/services-logic.ts` — visibility helpers.
- `src/hooks/recomputePlaceStats.ts` — service-aware filtering.
- `src/hooks/recomputeOnServiceStatusChange.ts` — re-trigger place recompute
  when a service's status changes (registered on `Services`).
- `src/app/(frontend)/[locale]/places/add-place/_component/` — new
  `StepServicesSelect`, wire into `AddPlaceForm`.
- `src/app/(frontend)/[locale]/places/[slug]/page.tsx` — service sections,
  add-service control, pass services to form.
- `src/components/ReviewForm.tsx` — star rows per target, per-target submit.
- `src/components/PlaceReviews.tsx` (or a new `ReviewTabs` wrapper) — tabbed
  review sections with per-tab avg + count.
- `payload-types.ts` — regenerated.

## Out of scope

- Service-specific pricing/hours metadata.
- A standalone services browse page (like `/categories`).
- Editing/renaming a service after creation.
- Per-service JSON-LD or SEO metadata.
