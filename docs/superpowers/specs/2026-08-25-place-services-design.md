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
- A review is *visible* iff it is `published` **and** it has no `service`, or
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
  the place and visible to the user before storing `service`.

### UI

- **Add-place wizard** — new `StepServicesSelect` step (reusing the
  `CreateModal`/`StepCategorySelect` patterns): multi-select approved services,
  plus inline "create service". Services remain optional; the place can have
  zero (legacy places).
- **Place page** — replace the flat reviews list with sections: a "General"
  section for reviews with no service, then one section per service, each
  showing its own rating avg + review count and its reviews. A logged-in user
  sees an "add service" control (creates a pending service); admins can also
  attach existing services and remove them.
- **ReviewForm** — optional service `<select>` listing the place's visible
  services.

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
- `src/components/ReviewForm.tsx` — service selector.
- `payload-types.ts` — regenerated.

## Out of scope

- Service-specific pricing/hours metadata.
- A standalone services browse page (like `/categories`).
- Editing/renaming a service after creation.
- Per-service JSON-LD or SEO metadata.
