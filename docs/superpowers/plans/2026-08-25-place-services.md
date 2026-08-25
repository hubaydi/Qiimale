# Place Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Place offer multiple Services (each with its own reviews and per-service rating), with reviews optionally targeting a specific service, displayed in tabbed sections.

**Architecture:** A new global `services` collection (mirroring `categories`/`cities`) with a `pending → approved` moderation flow. `places.services` becomes a hasMany relationship; `reviews.service` an optional relationship. Visibility is gated by service `status` (approved → public; pending → owner+admin only), enforced via new helpers in `src/lib/services-logic.ts` and applied at the query layer (the codebase already filters manually with `overrideAccess: true`). Per-service stats are computed on-the-fly by grouping visible reviews; place-level stats are recomputed from visible reviews only.

**Tech Stack:** Payload CMS 3 (MongoDB), Next.js 16 App Router, React 19, next-intl, react-hook-form + zod, vitest, biome, Tailwind v4 + shadcn.

## Global Constraints

- Package manager: `pnpm` (never npm/yarn).
- This Next.js version has breaking changes — read `node_modules/next/dist/docs/` before writing App Router code. Heed deprecation notices.
- Path alias `@/` maps to `src/`.
- Collection access is admin-only (`isAdmin`/`isAdminAccess` from `@/access/isAdmin`); frontend users mutate via server actions with `overrideAccess: true`.
- Every content-creation server action requires `user._verified` (the `UNVERIFIED` gate), except admin-only actions which check `user.role === "admin"`.
- Regenerate types after any schema change: `pnpm generate:types` (writes `payload-types.ts`).
- Lint: `pnpm lint` (biome). Typecheck: `pnpm exec tsc --noEmit`. Tests: `pnpm test` (vitest).
- No code comments except `ponytail:`-prefixed notes.

---

### Task 1: Services collection + registration + types

**Files:**
- Create: `src/collections/Services.ts`
- Modify: `src/collections/index.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Produces: a `services` collection registered in the Payload config; a generated `Service` type in `payload-types.ts`.

- [ ] **Step 1: Create the Services collection**

`src/collections/Services.ts`:

```ts
import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { isAdmin, isAdminAccess } from "@/access/isAdmin";

export const Services: CollectionConfig = {
  slug: "services",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "status", "submittedBy"],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    slugField({ useAsSlug: "name", position: "sidebar" }),
    { name: "description", type: "textarea", localized: true },
    {
      name: "status",
      type: "select",
      options: ["pending", "approved", "rejected"],
      defaultValue: "pending",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "submittedBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
```

- [ ] **Step 2: Register the collection**

`src/collections/index.ts` — add the import and export (alphabetical):

```ts
import { Services } from "./Services";
```

and add `Services,` to the export list (after `Reviews,`):

```ts
export {
  Flags,
  Media,
  Categories,
  Cities,
  Places,
  Reviews,
  Services,
  ReviewUpvotes,
  Users,
};
```

`src/payload.config.ts` — add `Services` to the import and to the `collections: [...]` array:

```ts
import {
  Categories,
  Cities,
  Flags,
  Media,
  Places,
  Reviews,
  ReviewUpvotes,
  Services,
  Users,
} from "./collections";
```

```ts
  collections: [
    Categories,
    Cities,
    Flags,
    Media,
    Places,
    Reviews,
    ReviewUpvotes,
    Services,
    Users,
  ],
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `payload-types.ts` now contains an `interface Service` (with `name`, `slug`, `description`, `status`, `submittedBy`).

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Services.ts src/collections/index.ts src/payload.config.ts payload-types.ts
git commit -m "feat: add services collection"
```

---

### Task 2: Service visibility helpers + tests

**Files:**
- Create: `src/lib/services-logic.ts`
- Test: `src/lib/services-logic.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions).
- Produces:
  - `canViewService(service: { status: string; submittedBy?: string | { id?: string } | null } | null | undefined, user: { id: string; role?: string } | null): boolean`
  - `reviewIsVisible(review: { status: string; service?: unknown }, user: { id: string; role?: string } | null): boolean`
  - `visibleServicesQuery(user: { id: string; role?: string } | null): Where` (imports `Where` from `"payload"`)

- [ ] **Step 1: Write the failing test**

`src/lib/services-logic.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canViewService,
  reviewIsVisible,
  visibleServicesQuery,
} from "./services-logic";

const service = (status: string, submittedBy?: string) => ({
  status,
  submittedBy,
});

describe("canViewService", () => {
  it("allows approved services for anyone", () => {
    expect(canViewService(service("approved"), null)).toBe(true);
    expect(canViewService(service("approved"), { id: "u1" })).toBe(true);
  });
  it("denies pending services to anonymous and non-owners", () => {
    expect(canViewService(service("pending", "u1"), null)).toBe(false);
    expect(canViewService(service("pending", "u1"), { id: "u2" })).toBe(false);
  });
  it("allows the owner to view their own pending service", () => {
    expect(canViewService(service("pending", "u1"), { id: "u1" })).toBe(true);
  });
  it("allows admins to view any service", () => {
    expect(
      canViewService(service("pending", "u1"), { id: "admin", role: "admin" }),
    ).toBe(true);
    expect(
      canViewService(service("rejected", "u1"), { id: "admin", role: "admin" }),
    ).toBe(true);
  });
  it("denies rejected services to the owner", () => {
    expect(canViewService(service("rejected", "u1"), { id: "u1" })).toBe(false);
  });
  it("returns false for a null service", () => {
    expect(canViewService(null, { id: "u1" })).toBe(false);
  });
});

describe("reviewIsVisible", () => {
  it("hides non-published reviews", () => {
    expect(reviewIsVisible({ status: "hidden" }, null)).toBe(false);
  });
  it("shows published reviews with no service", () => {
    expect(reviewIsVisible({ status: "published", service: null }, null)).toBe(
      true,
    );
  });
  it("shows published reviews on an approved service", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("approved") },
        null,
      ),
    ).toBe(true);
  });
  it("hides published reviews on a pending service from strangers", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("pending", "u1") },
        null,
      ),
    ).toBe(false);
  });
  it("shows published reviews on own pending service to the owner", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("pending", "u1") },
        { id: "u1" },
      ),
    ).toBe(true);
  });
  it("hides reviews whose service is an unpopulated id string", () => {
    expect(
      reviewIsVisible({ status: "published", service: "svc1" }, null),
    ).toBe(false);
  });
});

describe("visibleServicesQuery", () => {
  it("anonymous sees approved only", () => {
    expect(visibleServicesQuery(null)).toEqual({
      status: { equals: "approved" },
    });
  });
  it("owner sees approved or own pending", () => {
    expect(visibleServicesQuery({ id: "u1" })).toEqual({
      or: [
        { status: { equals: "approved" } },
        {
          and: [
            { status: { equals: "pending" } },
            { submittedBy: { equals: "u1" } },
          ],
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/services-logic.test.ts`
Expected: FAIL — module `./services-logic` cannot be resolved.

- [ ] **Step 3: Implement the helpers**

`src/lib/services-logic.ts`:

```ts
import type { Where } from "payload";

type Viewer = { id: string; role?: string } | null;

type ServiceRef = {
  status: string;
  submittedBy?: string | { id?: string } | null;
};

export function canViewService(
  service: ServiceRef | null | undefined,
  user: Viewer,
): boolean {
  if (!service) return false;
  if (service.status === "approved") return true;
  if (user?.role === "admin") return true;
  const ownerId =
    typeof service.submittedBy === "object"
      ? service.submittedBy?.id
      : service.submittedBy;
  return service.status === "pending" && ownerId === user?.id;
}

export function reviewIsVisible(
  review: { status: string; service?: unknown },
  user: Viewer,
): boolean {
  if (review.status !== "published") return false;
  if (review.service == null) return true;
  if (typeof review.service === "string") return false;
  return canViewService(review.service as ServiceRef, user);
}

export function visibleServicesQuery(user: Viewer): Where {
  if (!user) return { status: { equals: "approved" } };
  return {
    or: [
      { status: { equals: "approved" } },
      {
        and: [
          { status: { equals: "pending" } },
          { submittedBy: { equals: user.id } },
        ],
      },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/services-logic.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/services-logic.ts src/lib/services-logic.test.ts
git commit -m "feat: add service visibility helpers"
```

---

### Task 3: Places.services + Reviews.service fields + types

**Files:**
- Modify: `src/collections/Places.ts`
- Modify: `src/collections/Reviews.ts`

**Interfaces:**
- Produces: `Place.services?: (string | Service)[] | null` and `Review.service?: (string | null) | Service` in `payload-types.ts`.

- [ ] **Step 1: Add `services` field to Places**

In `src/collections/Places.ts`, add after the `category` field (before `city`):

```ts
    {
      name: "services",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      admin: { position: "sidebar" },
    },
```

- [ ] **Step 2: Add `service` field to Reviews**

In `src/collections/Reviews.ts`, add after the `place` field (before `author`):

```ts
    {
      name: "service",
      type: "relationship",
      relationTo: "services",
      index: true,
    },
```

- [ ] **Step 3: Regenerate types**

Run: `pnpm generate:types`
Expected: `Place` gains `services?`, `Review` gains `service?`.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Places.ts src/collections/Reviews.ts payload-types.ts
git commit -m "feat: add services relation to places and reviews"
```

---

### Task 4: Service-aware place stats

**Files:**
- Modify: `src/hooks/recomputePlaceStats.ts`
- Create: `src/hooks/recomputeOnServiceStatusChange.ts`
- Modify: `src/collections/Services.ts`

**Interfaces:**
- Consumes: `reviewIsVisible` from `@/lib/services-logic` (Task 2); `computeStats` from `@/lib/reviews-logic`.
- Produces: `resyncPlaceStats(args: { payload: Payload; placeId: string; req: PayloadRequest }): Promise<void>` (exported); `recomputeOnReviewChange`, `recomputeOnReviewDelete` (unchanged exports); `recomputeOnServiceStatusChange` (CollectionAfterChangeHook).

- [ ] **Step 1: Refactor recomputePlaceStats to filter visible reviews**

Replace the whole `src/hooks/recomputePlaceStats.ts` with:

```ts
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from "payload";
import { computeStats } from "@/lib/reviews-logic";
import { reviewIsVisible } from "@/lib/services-logic";

export async function resyncPlaceStats(args: {
  payload: Payload;
  placeId: string;
  req: PayloadRequest;
}) {
  if (args.req.context.skipStats) return;
  const full = await args.payload.find({
    collection: "reviews",
    where: {
      and: [
        { place: { equals: args.placeId } },
        { status: { equals: "published" } },
      ],
    },
    limit: 100000,
    depth: 1,
    req: args.req,
  });
  const ratings = full.docs
    .filter((r) => reviewIsVisible(r, null))
    .map((r) => r.rating);
  const stats = computeStats(ratings);
  await args.payload.update({
    collection: "places",
    id: args.placeId,
    data: { ratingAvg: stats.avg, reviewCount: stats.count },
    overrideAccess: true,
    req: args.req,
    context: { skipStats: true },
  });
}

export const recomputeOnReviewChange: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const placeId = typeof doc.place === "string" ? doc.place : doc.place?.id;
  if (!placeId) return doc;
  await resyncPlaceStats({ payload: req.payload, placeId, req });
  return doc;
};

export const recomputeOnReviewDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const placeId = doc?.place
    ? typeof doc.place === "string"
      ? doc.place
      : doc.place.id
    : null;
  if (!placeId) return;
  await resyncPlaceStats({ payload: req.payload, placeId, req });
};
```

- [ ] **Step 2: Create the service-status hook**

`src/hooks/recomputeOnServiceStatusChange.ts`:

```ts
import type { CollectionAfterChangeHook } from "payload";
import { resyncPlaceStats } from "@/hooks/recomputePlaceStats";

export const recomputeOnServiceStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const before = (previousDoc as { status?: string } | undefined)?.status;
  if (before === doc.status) return doc;

  const reviews = await req.payload.find({
    collection: "reviews",
    where: { service: { equals: doc.id } },
    limit: 100000,
    req,
  });

  const placeIds = new Set(
    reviews.docs
      .map((r) =>
        typeof r.place === "string" ? r.place : (r.place as { id?: string })?.id,
      )
      .filter((id): id is string => Boolean(id)),
  );

  for (const placeId of placeIds) {
    await resyncPlaceStats({ payload: req.payload, placeId, req });
  }
  return doc;
};
```

- [ ] **Step 3: Register the hook on Services**

In `src/collections/Services.ts`, add the import and a `hooks` block:

```ts
import { recomputeOnServiceStatusChange } from "@/hooks/recomputeOnServiceStatusChange";
```

and after the `access: {...}` block add:

```ts
  hooks: {
    afterChange: [recomputeOnServiceStatusChange],
  },
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass. (The pure filtering logic — `reviewIsVisible` — is already covered by Task 2's tests.)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/recomputePlaceStats.ts src/hooks/recomputeOnServiceStatusChange.ts src/collections/Services.ts
git commit -m "feat: recompute place stats from visible reviews only"
```

---

### Task 5: Services server actions

**Files:**
- Create: `src/actions/services.ts`

**Interfaces:**
- Consumes: `getPayloadClient` (`@/lib/get-payload`), `getCurrentUser` (`@/lib/session`), `error`/`ActionResult` (`@/lib/types`), types `Place`/`Service` (`@/payload-types`).
- Produces (all server actions, `"use server"`):
  - `createService(name: string, description?: string): Promise<ActionResult<{ id: string }>>`
  - `createServiceForPlace(input): Promise<ActionResult<{ serviceId: string }>>` where `input = { placeId: string; name: string; description?: string }`
  - `addServiceToPlace(input): Promise<ActionResult<{ placeId: string }>>` where `input = { placeId: string; serviceId: string }`
  - `removeServiceFromPlace(input): Promise<ActionResult<{ placeId: string }>>` where `input = { placeId: string; serviceId: string }`

- [ ] **Step 1: Write the actions**

`src/actions/services.ts`:

```ts
"use server";

import type { RequiredDataFromCollectionSlug } from "payload";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Place, Service } from "@/payload-types";

const createSchema = z.object({
  name: z.string().min(2, "Service name is required").max(50),
  description: z.string().max(200).optional(),
});

export async function createService(
  name: string,
  description?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse({ name, description });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Service name is required",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  if (!user._verified) return error("UNVERIFIED", "Verify email first");

  const payload = await getPayloadClient();
  const created = (await payload.create({
    collection: "services",
    data: {
      name: parsed.data.name,
      generateSlug: true,
      description: parsed.data.description,
      status: "pending",
      submittedBy: user.id,
    } as RequiredDataFromCollectionSlug<"services">,
    overrideAccess: true,
    user,
  })) as Service;
  return { ok: true, data: { id: created.id } };
}

const placeCreateSchema = z.object({
  placeId: z.string(),
  name: z.string().min(2, "Service name is required").max(50),
  description: z.string().max(200).optional(),
});

export async function createServiceForPlace(
  input: z.infer<typeof placeCreateSchema> & Record<string, unknown>,
): Promise<ActionResult<{ serviceId: string }>> {
  const parsed = placeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (!user._verified) return error("UNVERIFIED", "Verify email first");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  if (!place) return error("NOT_FOUND", "Place not found");

  const created = (await payload.create({
    collection: "services",
    data: {
      name: parsed.data.name,
      generateSlug: true,
      description: parsed.data.description,
      status: "pending",
      submittedBy: user.id,
    } as RequiredDataFromCollectionSlug<"services">,
    overrideAccess: true,
    user,
  })) as Service;

  const current = (place.services ?? []).map((s) =>
    typeof s === "string" ? s : s.id,
  );
  await payload.update({
    collection: "places",
    id: place.id,
    data: { services: [...current, created.id] },
    overrideAccess: true,
    user,
  });

  revalidatePath(`/places/${place.slug}`);
  return { ok: true, data: { serviceId: created.id } };
}

const attachSchema = z.object({
  placeId: z.string(),
  serviceId: z.string(),
});

export async function addServiceToPlace(
  input: z.infer<typeof attachSchema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (user.role !== "admin") return error("FORBIDDEN", "Admin only");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  const service = (await payload.findByID({
    collection: "services",
    id: parsed.data.serviceId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Service | null;

  if (!place || !service) return error("NOT_FOUND", "Not found");
  if (service.status !== "approved") {
    return error("VALIDATION", "Service is not approved");
  }

  const current = (place.services ?? []).map((s) =>
    typeof s === "string" ? s : s.id,
  );
  if (!current.includes(service.id)) {
    await payload.update({
      collection: "places",
      id: place.id,
      data: { services: [...current, service.id] },
      overrideAccess: true,
      user,
    });
    revalidatePath(`/places/${place.slug}`);
  }
  return { ok: true, data: { placeId: place.id } };
}

export async function removeServiceFromPlace(
  input: z.infer<typeof attachSchema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (user.role !== "admin") return error("FORBIDDEN", "Admin only");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
  if (!place) return error("NOT_FOUND", "Place not found");

  const next = (place.services ?? [])
    .map((s) => (typeof s === "string" ? s : s.id))
    .filter((id) => id !== parsed.data.serviceId);

  await payload.update({
    collection: "places",
    id: place.id,
    data: { services: next },
    overrideAccess: true,
    user,
  });
  revalidatePath(`/places/${place.slug}`);
  return { ok: true, data: { placeId: place.id } };
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/actions/services.ts
git commit -m "feat: add service server actions"
```

---

### Task 6: submitReview serviceId + per-target review

**Files:**
- Modify: `src/actions/reviews.ts`

**Interfaces:**
- Consumes: `canViewService` from `@/lib/services-logic` (Task 2).
- Produces: `submitReview` now accepts an optional `serviceId`; creates/updates the review for the `(place, author, target)` tuple.

- [ ] **Step 1: Update the schema and validation**

In `src/actions/reviews.ts`, change the schema:

```ts
const schema = z.object({
  placeId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(3),
  photoIds: z.array(z.string()).max(3).optional(),
  serviceId: z.string().optional(),
});
```

Add the import:

```ts
import { canViewService } from "@/lib/services-logic";
```

- [ ] **Step 2: Fetch place with services and validate service**

Replace the existing `place` fetch (the `payload.findByID` block with `overrideAccess: true, user`) — add `depth: 0`:

```ts
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
    depth: 0,
  })) as Place | null;
```

Immediately after the `if (!place || !canViewOwnPending(...))` guard, add service validation:

```ts
  let serviceId: string | undefined;
  if (parsed.data.serviceId) {
    const service = await payload.findByID({
      collection: "services",
      id: parsed.data.serviceId,
      overrideAccess: true,
      user,
    });
    if (!service || !canViewService(service as Service, user)) {
      return error("NOT_FOUND", "Service not found");
    }
    const attached = (place.services ?? []).some(
      (s) => (typeof s === "string" ? s : s.id) === parsed.data.serviceId,
    );
    if (!attached) {
      return error("NOT_FOUND", "Service not available for this place");
    }
    serviceId = parsed.data.serviceId;
  }
```

Add `Service` to the type import:

```ts
import type { Place, Review, Service } from "@/payload-types";
```

- [ ] **Step 3: Narrow the existing-review lookup by target**

Replace the existing `const existing = await payload.find({ ... })` block's `where` with a target-aware filter:

```ts
  const serviceFilter = serviceId
    ? { service: { equals: serviceId } }
    : { service: { exists: false } };

  const existing = await payload.find({
    collection: "reviews",
    where: {
      and: [
        { place: { equals: parsed.data.placeId } },
        { author: { equals: user.id } },
        serviceFilter,
      ],
    },
    limit: 1,
    overrideAccess: true,
    user,
  });
```

- [ ] **Step 4: Store the service on the review**

In the `data` object, add `service: serviceId,` after `place`:

```ts
  const data = {
    rating: parsed.data.rating,
    text: parsed.data.text,
    status: "published" as const,
    author: user.id,
    place: parsed.data.placeId,
    service: serviceId,
    photos: (parsed.data.photoIds || []).map((id) => ({ image: id })),
  };
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/actions/reviews.ts
git commit -m "feat: allow reviews to target a service"
```

---

### Task 7: addPlace serviceIds

**Files:**
- Modify: `src/actions/places.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `addPlace` accepts an optional `serviceIds: string[]`, attaching only approved services or the caller's own pending services.

- [ ] **Step 1: Extend the schema**

In `src/actions/places.ts`, add to the schema:

```ts
  serviceIds: z.array(z.string()).optional(),
```

- [ ] **Step 2: Validate and attach services before creating the place**

After the existing category validation (`if (!category || ...)` block) and before `const created`, add:

```ts
  const requested = parsed.data.serviceIds ?? [];
  let serviceIds: string[] = [];
  if (requested.length) {
    const found = await payload.find({
      collection: "services",
      where: { id: { in: requested } },
      limit: requested.length,
      overrideAccess: true,
    });
    serviceIds = found.docs
      .filter(
        (s) =>
          s.status === "approved" ||
          (typeof s.submittedBy === "object"
            ? s.submittedBy?.id
            : s.submittedBy) === user.id,
      )
      .map((s) => s.id);
  }
```

- [ ] **Step 3: Include services in the created place**

In the `data` object passed to `payload.create` (inside the cast), add `services: serviceIds,` after `category`:

```ts
      name: parsed.data.name,
      generateSlug: true,
      category: parsed.data.categoryId,
      services: serviceIds,
      city: parsed.data.cityId,
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/actions/places.ts
git commit -m "feat: attach services when adding a place"
```

---

### Task 8: Add-place wizard — services step

**Files:**
- Create: `src/app/(frontend)/[locale]/places/add-place/_component/StepServicesSelect.tsx`
- Modify: `src/app/(frontend)/[locale]/places/add-place/_component/types.ts`
- Modify: `src/app/(frontend)/[locale]/places/add-place/_component/StepIndicator.tsx`
- Modify: `src/app/(frontend)/[locale]/places/add-place/_component/AddPlaceForm.tsx`
- Modify: `src/app/(frontend)/[locale]/places/add-place/page.tsx`
- Modify: `messages/en.json`, `messages/so.json`

**Interfaces:**
- Consumes: `createService` from `@/actions/services` (Task 5); `ServiceOption` (new type); `getLocalizedName` from `./utils`; `visibleServicesQuery` (Task 2).
- Produces: `StepServicesSelect` component; `ServiceOption` interface; `AddPlaceForm` accepts a `services` prop and submits `serviceIds`.

- [ ] **Step 1: Add ServiceOption type**

In `types.ts`, append:

```ts
export interface ServiceOption {
  id: string;
  name: string;
  description?: string | null;
  status?: "pending" | "approved" | "rejected";
}
```

- [ ] **Step 2: Create StepServicesSelect**

`StepServicesSelect.tsx`:

```tsx
"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ServiceOption } from "./types";
import { getLocalizedName } from "./utils";

export function StepServicesSelect({
  services,
  selectedIds,
  onToggle,
  onCreate,
}: {
  services: ServiceOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
}) {
  const t = useTranslations("AddPlace");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <span className="block text-sm font-semibold text-foreground">
        {t("selectServices")}
      </span>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noServices")}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {services.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <label
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-input bg-card px-4 py-3 cursor-pointer hover:border-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(s.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">
                  {getLocalizedName(s.name, locale)}
                  {s.status === "pending" ? ` (${t("pendingSuffix")})` : ""}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
      >
        <Plus size={16} />
        <span>{t("createService")}</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Add a 4th step to StepIndicator**

In `StepIndicator.tsx`, change the prop type to `1 | 2 | 3 | 4` and insert the services step:

```tsx
export function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  ...
  const steps = [
    { num: 1, key: "stepCity" },
    { num: 2, key: "stepCategory" },
    { num: 3, key: "stepServices" },
    { num: 4, key: "stepDetails" },
  ] as const;
```

- [ ] **Step 4: Wire services into AddPlaceForm**

In `AddPlaceForm.tsx`:

1. Add imports:
```ts
import { createService } from "@/actions/services";
import { StepServicesSelect } from "./StepServicesSelect";
import type { CategoryOption, CityOption, ServiceOption } from "./types";
```

2. Add `services: initialServices` prop and state:
```ts
export function AddPlaceForm({
  cities: initialCities,
  categories: initialCategories,
  services: initialServices,
}: {
  cities: CityOption[];
  categories: CategoryOption[];
  services: ServiceOption[];
}) {
  ...
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>(initialServices);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
```

3. Change `step` state type to `1 | 2 | 3 | 4` and update navigation:

```ts
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
```

`canGoNext`:
```ts
  function canGoNext(): boolean {
    if (step === 1) return selectedCityId !== null;
    if (step === 2) return selectedCatId !== null;
    if (step === 3) return true;
    return true;
  }
```

`handleNext`:
```ts
  function handleNext() {
    if (!canGoNext()) return;
    setServerError(null);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }
```

`handleBack`:
```ts
  function handleBack() {
    setServerError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }
```

4. Add a toggle handler and a service-created handler:

```ts
  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleServiceCreated(id: string, name: string) {
    setServices((prev) => [...prev, { id, name }]);
    setSelectedServiceIds((prev) => [...prev, id]);
  }
```

5. Render step 3 and shift details to step 4:

```tsx
        {step === 3 && (
          <StepServicesSelect
            services={services}
            selectedIds={selectedServiceIds}
            onToggle={toggleService}
            onCreate={() => setServiceModalOpen(true)}
          />
        )}
        {step === 4 && (
          <StepDetails ... />
        )}
```

6. In `onSubmit`, pass `serviceIds`:

```ts
      const res = await addPlace({
        name: data.name,
        categoryId: selectedCatId,
        cityId: selectedCityId,
        serviceIds: selectedServiceIds,
        address: data.address || "",
        description: data.description || "",
        imageId,
      });
```

7. Add a third `CreateModal` for services (after the category modal):

```tsx
      <CreateModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={t("createService")}
        label={t("serviceName")}
        onSubmitAction={async (name, description) => {
          const res = await createService(name, description);
          if (res.ok) handleServiceCreated(res.data.id, name);
          return res;
        }}
      />
```

- [ ] **Step 5: Pass services from the page**

In `add-place/page.tsx`, add a `services` fetch to the `Promise.all` and pass it down. Replace the existing `const [cities, cats] = await Promise.all([...])` with a three-way fetch:

```ts
  const [cities, cats, services] = await Promise.all([
    payload.find({
      collection: "cities",
      where: visibleContentQuery(user),
      limit: 100,
      overrideAccess: true,
    }),
    payload.find({
      collection: "categories",
      where: visibleContentQuery(user),
      limit: 100,
      overrideAccess: true,
    }),
    payload.find({
      collection: "services",
      where: visibleServicesQuery(user),
      limit: 200,
      overrideAccess: true,
    }),
  ]);
```

Add import: `import { visibleServicesQuery } from "@/lib/services-logic";`

And pass the prop:

```tsx
      <AddPlaceForm
        cities={...}
        categories={...}
        services={services.docs.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          status: s.status,
        }))}
      />
```

- [ ] **Step 6: Add translations**

Add to `AddPlace` namespace in both message files:

`messages/en.json`:
```json
    "stepServices": "Services",
    "selectServices": "Select services (optional)",
    "createService": "Create new service",
    "serviceName": "Service name",
    "noServices": "No services yet. Create one below."
```

`messages/so.json`:
```json
    "stepServices": "Adeegyada",
    "selectServices": "Dooro adeegyo (ikhtiyaar)",
    "createService": "Ku dar adeeg cusub",
    "serviceName": "Magaca adeegga",
    "noServices": "Weli adeegyo ma jiraan. Ku dar mid hoos."
```

- [ ] **Step 7: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(frontend)/[locale]/places/add-place" messages/en.json messages/so.json
git commit -m "feat: add services step to add-place wizard"
```

---

### Task 9: Place page — services list, tabbed reviews, manage services

**Files:**
- Create: `src/components/ServiceReviewTabs.tsx`
- Create: `src/components/ManageServices.tsx`
- Modify: `src/app/(frontend)/[locale]/places/[slug]/page.tsx`
- Modify: `messages/en.json`, `messages/so.json`

**Interfaces:**
- Consumes: `canViewService`, `reviewIsVisible` (`@/lib/services-logic`); `computeStats` (`@/lib/reviews-logic`); `ReviewCard`, `StarRating`; service actions (`@/actions/services`).
- Produces: `ServiceReviewTabs` (client, renders tabs + per-tab sort + distribution sidebar + list); `ManageServices` (client, add/attach/remove service controls).

- [ ] **Step 1: Create ServiceReviewTabs**

`src/components/ServiceReviewTabs.tsx`:

```tsx
"use client";

import { MessageSquare, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { StarRating } from "@/components/StarRating";

const SORTS = ["recent", "top", "high", "low"] as const;
type SortKey = (typeof SORTS)[number];

export type ReviewsTab = {
  id: string;
  label: string;
  rating: number;
  count: number;
  distribution: [number, number, number, number, number];
  reviews: { id: string; rating: number; upvoteCount: number; createdAt: string }[];
  cards: ReactNode[];
};

export function ServiceReviewTabs({ tabs }: { tabs: ReviewsTab[] }) {
  const t = useTranslations("Review");
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [sort, setSort] = useState<SortKey>("recent");

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;

  const order = active.reviews
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const byRecent =
        a.r.createdAt < b.r.createdAt ? 1 : a.r.createdAt > b.r.createdAt ? -1 : 0;
      switch (sort) {
        case "top":
          return (b.r.upvoteCount || 0) - (a.r.upvoteCount || 0) || byRecent;
        case "high":
          return b.r.rating - a.r.rating || byRecent;
        case "low":
          return a.r.rating - b.r.rating || byRecent;
        default:
          return byRecent;
      }
    });

  const total = active.distribution.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              tab.id === active.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-b pb-4">
        <MessageSquare size={20} className="text-primary" />
        <h2 className="text-xl font-bold">{active.label}</h2>
        <div className="flex items-center gap-2">
          <StarRating value={Math.round(active.rating)} size={16} />
          <span className="text-sm font-bold text-rating">
            {active.rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">({active.count})</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs bg-muted p-1 rounded-lg border border-border">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                sort === s
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(
                `sort${s[0].toUpperCase()}${s.slice(1)}` as
                  | "sortRecent"
                  | "sortTop"
                  | "sortHigh"
                  | "sortLow",
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-soft">
            <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
              {t("ratingBreakdown")}
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = active.distribution[5 - stars];
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right">{stars}</span>
                    <Star
                      size={12}
                      className="fill-rating text-rating shrink-0"
                    />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rating rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {active.reviews.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">{t("noReviews")}</p>
              <p className="text-sm">{t("noReviewsHint")}</p>
            </div>
          ) : (
            <div className="space-y-4">{order.map(({ i }) => active.cards[i])}</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Note: `t("ratingBreakdown")` and `t("noReviews")`/`t("noReviewsHint")` — `noReviews`/`noReviewsHint` already exist under `Review`; add `ratingBreakdown` to the `Review` namespace in Step 5 (it was previously inline in the page as `locale === "so" ? "Qiimaynta" : "Rating breakdown"`).

- [ ] **Step 2: Create ManageServices**

`src/components/ManageServices.tsx`:

```tsx
"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  addServiceToPlace,
  createServiceForPlace,
  removeServiceFromPlace,
} from "@/actions/services";

export function ManageServices({
  placeId,
  attached,
  isAdmin,
  available,
}: {
  placeId: string;
  attached: { id: string; name: string }[];
  isAdmin: boolean;
  available: { id: string; name: string }[];
}) {
  const t = useTranslations("Place");
  const router = useRouter();
  const [name, setName] = useState("");
  const [attachId, setAttachId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function create() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createServiceForPlace({ placeId, name: name.trim() });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setName("");
      router.refresh();
    });
  }

  function attach() {
    if (!attachId) return;
    setError(null);
    startTransition(async () => {
      const res = await addServiceToPlace({ placeId, serviceId: attachId });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setAttachId("");
      router.refresh();
    });
  }

  function remove(serviceId: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeServiceFromPlace({ placeId, serviceId });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("servicePlaceholder")}
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={create}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          <span>{t("addService")}</span>
        </button>
      </div>

      {isAdmin && available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={attachId}
            onChange={(e) => setAttachId(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">{t("attachService")}</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={attach}
            disabled={!attachId || isPending}
            className="rounded-lg border border-input px-3 py-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            +
          </button>
        </div>
      )}

      {isAdmin && attached.length > 0 && (
        <ul className="space-y-1">
          {attached.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between text-sm text-muted-foreground"
            >
              <span>{s.name}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`${t("remove")} ${s.name}`}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite the place page data fetch**

In `src/app/(frontend)/[locale]/places/[slug]/page.tsx`:

1. Update imports. `ReviewCard`, `ReviewForm`, and `StarRating` are already imported. Add these (and remove the now-unused `PlaceReviews` and `Star` imports from the top of the file):

```ts
import { ServiceReviewTabs, type ReviewsTab } from "@/components/ServiceReviewTabs";
import { ManageServices } from "@/components/ManageServices";
import { canViewService, reviewIsVisible } from "@/lib/services-logic";
import { computeStats } from "@/lib/reviews-logic";
import type { Service } from "@/payload-types";
```

(`Place` and `Review` are already imported; add `Service` to that same `@/payload-types` type import line.)

2. After fetching `place` (already `depth: 1`), compute visible services:
```ts
  const services = ((place.services ?? []) as (string | Service)[])
    .filter((s) => typeof s === "object" && s !== null && canViewService(s, user))
    .map((s) => s as Service);
```

3. Change the reviews fetch to also filter by visibility, and group. Replace the `const reviewDocs = reviews.docs;` line and the later `reviewDocs` usages. After fetching `reviews` (keep `depth: 2`), do:

```ts
  const reviewDocs = reviews.docs.filter((r) => reviewIsVisible(r, user));
```

4. Build the tabs. Replace the old `ratingDistribution` block (the `const ratingDistribution = [0,0,0,0,0]` loop) with a tab builder:

```ts
  function distributionOf(list: Review[]): [number, number, number, number, number] {
    const d = [0, 0, 0, 0, 0];
    for (const r of list) {
      if (r.rating >= 1 && r.rating <= 5) d[5 - r.rating]++;
    }
    return d as [number, number, number, number, number];
  }

  function toTab(id: string, label: string, list: Review[]): ReviewsTab {
    const stats = computeStats(list.map((r) => r.rating));
    return {
      id,
      label,
      rating: stats.avg,
      count: list.length,
      distribution: distributionOf(list),
      reviews: list.map((r) => ({
        id: r.id,
        rating: r.rating,
        upvoteCount: r.upvoteCount || 0,
        createdAt: r.createdAt,
      })),
      cards: list.map((r) => <ReviewCard key={r.id} review={r} locale={locale} />),
    };
  }

  const generalTab = toTab(
    "general",
    t("overall"),
    reviewDocs.filter((r) => !r.service),
  );
  const serviceTabs = services.map((s) =>
    toTab(
      s.id,
      s.name,
      reviewDocs.filter((r) => {
        const sid = typeof r.service === "string" ? r.service : r.service?.id;
        return sid === s.id;
      }),
    ),
  );
  const tabs = [generalTab, ...serviceTabs];
```

Note: `r.service` is a populated `Service` object (depth 2), so `r.service?.id` resolves. The `.filter((r) => !r.service)` treats a string `service` as truthy — but with depth 2 it is an object or null. If a review's service was deleted it would be null, correctly landing in "general".

- [ ] **Step 4: Render services list + manage control + tabs**

1. Inside the main info card, after the `place.description` block, add the vertical services list:

```tsx
              {services.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("services")}
                  </span>
                  <ul className="mt-2 space-y-1">
                    {services.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <span className="text-primary">•</span>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
```

2. Below the main info card (after `</Reveal>`), if the user is logged in, render the manage control:

```tsx
      {user && (
        <ManageServices
          placeId={place.id}
          attached={services.map((s) => ({ id: s.id, name: s.name }))}
          isAdmin={user.role === "admin"}
          available={availableServices}
        />
      )}
```

3. Compute `availableServices` (admin-only attach list) near the top, after `services`:

```ts
  const availableServices =
    user?.role === "admin"
      ? ((
          await payload.find({
            collection: "services",
            where: { status: { equals: "approved" } },
            limit: 500,
            overrideAccess: true,
          })
        ).docs as Service[])
          .filter((s) => !services.some((v) => v.id === s.id))
          .map((s) => ({ id: s.id, name: s.name }))
      : [];
```

4. Replace the entire old reviews grid (`<div className="grid grid-cols-1 md:grid-cols-3 gap-8"> ... </div>`, containing the sidebar and `<PlaceReviews ... />`) with:

```tsx
      <ServiceReviewTabs tabs={tabs} />
```

5. Remove the now-unused imports: `PlaceReviews`, `Star` (if no longer used), and the `ratingDistribution`/`totalReviews` leftovers. Keep `totalReviews = place.reviewCount || 0` (still used by the header card and JSON-LD). Keep `StarRating` (used in the header card). Remove `Star` import only if unused — verify before removing (it was used in the sidebar only).

6. Update the existing `<ReviewForm>` call to pass services and the user's reviews:

```tsx
        <ReviewForm
          placeId={place.id}
          placeSlug={place.slug}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          existing={existingReviews}
        />
```

And replace the old `existingReview` single-lookup with:

```ts
  const existingReviews = user
    ? ((
        await payload.find({
          collection: "reviews",
          where: {
            and: [
              { place: { equals: place.id } },
              { author: { equals: user.id } },
            ],
          },
          limit: 100,
          overrideAccess: true,
          depth: 0,
        })
      ).docs as Review[]).map((r) => ({
        serviceId: typeof r.service === "string" ? r.service : null,
        rating: r.rating,
        text: r.text,
      }))
    : [];
```

- [ ] **Step 5: Add translations**

`messages/en.json` — add to `Place`:
```json
    "overall": "Overall",
    "services": "Services",
    "addService": "Add a service",
    "attachService": "Attach existing service",
    "remove": "Remove",
    "servicePlaceholder": "Service name"
```
add to `Review`:
```json
    "ratingBreakdown": "Rating breakdown"
```

`messages/so.json` — add to `Place`:
```json
    "overall": "Guud",
    "services": "Adeegyada",
    "addService": "Ku dar adeeg",
    "attachService": "Ku dar adeeg jira",
    "remove": "Ka saar",
    "servicePlaceholder": "Magaca adeegga"
```
add to `Review`:
```json
    "ratingBreakdown": "Qiimaynta"
```

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass. Fix any unused-import errors (remove `PlaceReviews`, `Star` if now unused).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(frontend)/[locale]/places/[slug]/page.tsx" src/components/ServiceReviewTabs.tsx src/components/ManageServices.tsx messages/en.json messages/so.json
git commit -m "feat: show services and tabbed reviews on place page"
```

---

### Task 10: ReviewForm — star rows per target

**Files:**
- Modify: `src/components/ReviewForm.tsx`
- Modify: `src/lib/review-draft.ts`
- Modify: `messages/en.json`, `messages/so.json`

**Interfaces:**
- Consumes: `submitReview` (Task 6, accepts `serviceId`); draft helpers.
- Produces: `ReviewForm` with new props `services: { id: string; name: string }[]` and `existing: { serviceId: string | null; rating: number; text: string }[]`; draft type includes `serviceId`.

- [ ] **Step 1: Extend the draft type**

In `src/lib/review-draft.ts`, change the type and the loader:

```ts
export type ReviewDraft = {
  rating: number;
  text: string;
  serviceId?: string | null;
};
```

In `loadReviewDraft`, after computing `text`, add serviceId parsing and return it:

```ts
    const serviceIdRaw = (parsed as { serviceId?: unknown }).serviceId;
    const serviceId = typeof serviceIdRaw === "string" ? serviceIdRaw : null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return { rating, text, serviceId };
```

- [ ] **Step 2: Rewrite ReviewForm**

Replace the whole `src/components/ReviewForm.tsx` with:

```tsx
"use client";

import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { uploadMedia } from "@/actions/media";
import { submitReview } from "@/actions/reviews";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "@/lib/review-draft";
import type { ActionResult } from "@/lib/types";

async function uploadPhoto(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res: ActionResult<{ id: string }> = await uploadMedia(fd);
  return res.ok ? res.data.id : null;
}

function StarRow({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <StarRating value={value} size={24} onChange={onSelect} />
    </div>
  );
}

export function ReviewForm({
  placeId,
  placeSlug,
  services,
  existing,
}: {
  placeId: string;
  placeSlug: string;
  services: { id: string; name: string }[];
  existing: { serviceId: string | null; rating: number; text: string }[];
}) {
  const t = useTranslations("Review");
  const locale = useLocale();
  const router = useRouter();

  const existingMap = new Map(
    existing.map((e) => [e.serviceId ?? "general", e]),
  );

  const [target, setTarget] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const draft = loadReviewDraft(window.sessionStorage, placeId);
    if (draft) {
      setTarget(draft.serviceId ?? "general");
      setRating(draft.rating);
      setText(draft.text);
    }
  }, [placeId]);

  function ratingFor(id: string): number {
    if (target === id) return rating;
    return existingMap.get(id)?.rating ?? 0;
  }

  function select(id: string, v: number) {
    setTarget(id);
    setRating(v);
    setText(existingMap.get(id)?.text ?? "");
    setServerError(null);
  }

  const currentName =
    target === "general"
      ? t("overall")
      : (services.find((s) => s.id === target)?.name ?? "");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit() {
    if (target === null || rating < 1) return;
    if (text.trim().length < 3) {
      setServerError(t("minLength"));
      return;
    }
    setServerError(null);
    startTransition(async () => {
      const photoIds: string[] = [];
      for (const f of files) {
        const id = await uploadPhoto(f);
        if (id) photoIds.push(id);
      }
      const res = await submitReview({
        placeId,
        rating,
        text,
        photoIds,
        serviceId: target === "general" ? undefined : target,
      });
      if (!res.ok) {
        if (res.error.code === "UNAUTHENTICATED") {
          saveReviewDraft(window.sessionStorage, placeId, {
            rating,
            text,
            serviceId: target === "general" ? null : target,
          });
          router.push(
            `/login?redirect=${encodeURIComponent(`/${locale}/places/${placeSlug}`)}`,
          );
          return;
        }
        setServerError(res.error.message);
        return;
      }
      clearReviewDraft(window.sessionStorage, placeId);
      router.push(`/places/${placeSlug}`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6 max-w-xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-soft"
    >
      <div className="space-y-3">
        <StarRow
          label={t("overall")}
          value={ratingFor("general")}
          onSelect={(v) => select("general", v)}
        />
        {services.map((s) => (
          <StarRow
            key={s.id}
            label={s.name}
            value={ratingFor(s.id)}
            onSelect={(v) => select(s.id, v)}
          />
        ))}
      </div>

      {target === null ? (
        <p className="text-sm text-muted-foreground">{t("pickTarget")}</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-primary">
            {target === "general"
              ? t("overallPrompt", { stars: rating })
              : t("servicePrompt", { stars: rating, service: currentName })}
          </p>

          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("commentPlaceholder")}
              rows={5}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-y"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("minLength")}</span>
              <span>{text.length} / 3+</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">
              {t("photos")}
            </span>
            <div className="grid grid-cols-3 gap-3">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square rounded-xl overflow-hidden border group"
                >
                  {/* biome-ignore lint/performance/noImgElement: local object url preview */}
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {files.length < 3 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-input hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-center p-2">
                  <Upload size={20} className="text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Ku dar sawir
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onFiles}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>{t("submit")}</span>
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Add translations**

`messages/en.json` — add to `Review`:
```json
    "overall": "Overall",
    "pickTarget": "Select stars to review the place or a specific service.",
    "servicePrompt": "You selected {stars} stars for {service}. Now leave a review for this service.",
    "overallPrompt": "You selected {stars} stars. Now leave a review."
```

`messages/so.json` — add to `Review`:
```json
    "overall": "Guud",
    "pickTarget": "Dooro xiddig si aad u qiimayso goobta ama adeeg gaar ah.",
    "servicePrompt": "Waxaad dooratay {stars} xiddig adeegga {service}. Hadda qor qiimayn ku saabsan adeeggan.",
    "overallPrompt": "Waxaad dooratay {stars} xiddig. Hadda qor qiimayn."
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: existing vitest suites (`places-logic`, `services-logic`, any others) pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ReviewForm.tsx src/lib/review-draft.ts messages/en.json messages/so.json
git commit -m "feat: per-service star rows in review form"
```

---

## Out of scope

- Service pricing/hours metadata; a standalone `/services` browse page.
- Editing/renaming a service after creation.
- Per-service JSON-LD/SEO.
- Showing the service name on the account page's review list.
