# Inline Review Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the review form from its own `/places/[slug]/review` page onto the place page, preserving a user's draft across the login round-trip.

**Architecture:** The existing client `ReviewForm` is rendered directly on the place page. Auth gating moves client-side: `submitReview` already returns `UNAUTHENTICATED`/`UNVERIFIED`, so the form redirects to login on the former (with draft stashed in `sessionStorage`) and shows the inline error on the latter. Login accepts a validated `redirect` param. Two pure helpers (draft storage, redirect-path safety) are added under `src/lib/` and unit-tested with vitest.

**Tech Stack:** Next.js App Router, next-intl, react-hook-form + zod, Payload, vitest.

## Global Constraints

- Package manager: pnpm. Never add new dependencies.
- Tests: vitest, node environment, files `src/**/*.test.ts`. Run `pnpm exec vitest run`.
- Typecheck: `pnpm exec tsc --noEmit` must pass. Lint: `pnpm lint` (biome) must pass.
- Follow the spec: `docs/superpowers/specs/2026-08-12-inline-review-form-design.md`.
- No code comments unless asked.

---

### Task 1: Review draft helpers

**Files:**
- Create: `src/lib/review-draft.ts`
- Test: `src/lib/review-draft.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ReviewDraft = { rating: number; text: string }`
  - `type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">`
  - `saveReviewDraft(storage: DraftStorage, placeId: string, draft: ReviewDraft): void`
  - `loadReviewDraft(storage: DraftStorage, placeId: string): ReviewDraft | null` — consumes the draft (one-shot) and returns `null` on missing/corrupt/invalid values.
  - `clearReviewDraft(storage: DraftStorage, placeId: string): void`

- [ ] **Step 1: Write the failing test**

Create `src/lib/review-draft.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "./review-draft";

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
}

describe("reviewDraft", () => {
  it("saves and loads a draft scoped to placeId", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 4, text: "Waa fiican" });
    saveReviewDraft(s, "p2", { rating: 2, text: "Xun" });
    expect(loadReviewDraft(s, "p1")).toEqual({ rating: 4, text: "Waa fiican" });
    expect(loadReviewDraft(s, "p2")).toEqual({ rating: 2, text: "Xun" });
  });

  it("is one-shot: reading consumes the draft", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 5, text: "A" });
    expect(loadReviewDraft(s, "p1")).toEqual({ rating: 5, text: "A" });
    expect(loadReviewDraft(s, "p1")).toBeNull();
  });

  it("returns null for missing, corrupt, or invalid drafts", () => {
    const s = createMockStorage();
    expect(loadReviewDraft(s, "nope")).toBeNull();
    s.setItem("qiimale:review-draft:bad", "{not json");
    expect(loadReviewDraft(s, "bad")).toBeNull();
    s.setItem(
      "qiimale:review-draft:bad2",
      JSON.stringify({ rating: 9, text: "x" }),
    );
    expect(loadReviewDraft(s, "bad2")).toBeNull();
  });

  it("clear removes the draft", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 3, text: "B" });
    clearReviewDraft(s, "p1");
    expect(loadReviewDraft(s, "p1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/review-draft.test.ts`
Expected: FAIL — module `./review-draft` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/review-draft.ts`:

```ts
export type ReviewDraft = { rating: number; text: string };
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const key = (placeId: string) => `qiimale:review-draft:${placeId}`;

export function saveReviewDraft(
  storage: DraftStorage,
  placeId: string,
  draft: ReviewDraft,
): void {
  storage.setItem(key(placeId), JSON.stringify(draft));
}

export function loadReviewDraft(
  storage: DraftStorage,
  placeId: string,
): ReviewDraft | null {
  const raw = storage.getItem(key(placeId));
  if (!raw) return null;
  storage.removeItem(key(placeId));
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const rating = Number((parsed as { rating?: unknown }).rating);
    const text = String((parsed as { text?: unknown }).text ?? "");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return { rating, text };
  } catch {
    return null;
  }
}

export function clearReviewDraft(
  storage: DraftStorage,
  placeId: string,
): void {
  storage.removeItem(key(placeId));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/review-draft.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/review-draft.ts src/lib/review-draft.test.ts
git commit -m "feat: review draft storage helpers"
```

---

### Task 2: Login redirect path validation

**Files:**
- Create: `src/lib/login-redirect.ts`
- Test: `src/lib/login-redirect.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `isSafeLocalPath(path: string): boolean` — `true` only for paths that start with `/` but not `//` (blocks open redirects via `//evil.com`, external `https://` URLs, and protocol-relative/scheme tricks).

- [ ] **Step 1: Write the failing test**

Create `src/lib/login-redirect.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isSafeLocalPath } from "./login-redirect";

describe("isSafeLocalPath", () => {
  it("accepts local paths", () => {
    expect(isSafeLocalPath("/")).toBe(true);
    expect(isSafeLocalPath("/places/foo")).toBe(true);
    expect(isSafeLocalPath("/so/places/foo")).toBe(true);
  });

  it("rejects external and unsafe targets", () => {
    expect(isSafeLocalPath("//evil.com")).toBe(false);
    expect(isSafeLocalPath("https://evil.com")).toBe(false);
    expect(isSafeLocalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeLocalPath("places/foo")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/login-redirect.test.ts`
Expected: FAIL — module `./login-redirect` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/login-redirect.ts`:

```ts
export function isSafeLocalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/login-redirect.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/login-redirect.ts src/lib/login-redirect.test.ts
git commit -m "feat: validate login redirect targets"
```

---

### Task 3: ReviewForm — draft save/restore and login redirect

**Files:**
- Modify: `src/components/ReviewForm.tsx`

**Interfaces:**
- Consumes:
  - From Task 1: `saveReviewDraft`, `loadReviewDraft`, `clearReviewDraft`, `ReviewDraft`.
  - `submitReview` from `@/actions/reviews` (unchanged). Its error payload shape: `{ error: { code: "UNAUTHENTICATED" | "UNVERIFIED" | ..., message: string } }` when `!ok`.
  - `useLocale` from `next-intl` (client-safe).
- Produces: no new exports. Behavior change: on `UNAUTHENTICATED` it stashes the draft and redirects to `/login?redirect=/{locale}/places/{placeSlug}`; on mount it restores a one-shot draft; on success it clears any draft.

- [ ] **Step 1: Read the current file**

Read `src/components/ReviewForm.tsx` fully. It is a `"use client"` component using `useForm`, `useRouter`, `useTranslations("Review")`, with `onSubmit` calling `submitReview` and `router.push(\`/places/${placeSlug}\`)` on success. `rating` and `text` are watched via `const rating = watch("rating"); const text = watch("text");`.

- [ ] **Step 2: Add imports**

Add to the import block:

```ts
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
```

and replace `import { useTranslations } from "next-intl";` with the combined line above. Add:

```ts
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "@/lib/review-draft";
```

- [ ] **Step 3: Add `useLocale` and a draft-restore effect**

Inside the `ReviewForm` component, after `const t = useTranslations("Review");` add `const locale = useLocale();`.

Then add a `useEffect` that restores a one-shot draft on mount (place it after the `useForm` destructure, so `setValue` is available):

```ts
useEffect(() => {
  const draft = loadReviewDraft(window.sessionStorage, placeId);
  if (draft) {
    setValue("rating", draft.rating, { shouldValidate: true });
    setValue("text", draft.text, { shouldValidate: true });
  }
}, [placeId, setValue]);
```

- [ ] **Step 4: Handle `UNAUTHENTICATED` and clear draft on success**

Replace the `onSubmit` failure handling so the `UNAUTHENTICATED` case stashes the draft and sends the user to login:

```ts
function onSubmit(data: ReviewFormValues) {
  setServerError(null);
  startTransition(async () => {
    const photoIds: string[] = [];
    for (const f of files) {
      const id = await uploadPhoto(f);
      if (id) photoIds.push(id);
    }
    const res: ActionResult<{ reviewId: string }> = await submitReview({
      placeId,
      rating: data.rating,
      text: data.text,
      photoIds,
    });
    if (!res.ok) {
      if (res.error.code === "UNAUTHENTICATED") {
        saveReviewDraft(window.sessionStorage, placeId, {
          rating: data.rating,
          text: data.text,
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
```

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no output (pass).

Run: `pnpm lint`
Expected: no errors (biome may auto-report; fix any findings).

- [ ] **Step 6: Commit**

```bash
git add src/components/ReviewForm.tsx
git commit -m "feat: save review draft across login and redirect"
```

---

### Task 4: Login page + form redirect support

**Files:**
- Modify: `src/app/(frontend)/[locale]/login/page.tsx`
- Modify: `src/components/LoginForm.tsx`

**Interfaces:**
- Consumes:
  - From Task 2: `isSafeLocalPath`.
  - `LoginForm` props (existing): `showVerified?`, `showReset?`, `oauthError?`.
- Produces:
  - `LoginPage` accepts `searchParams.redirect?: string` and passes a validated `redirect: string | null` to `LoginForm`.
  - `LoginForm` gains optional prop `redirect?: string | null`; on success it pushes to `redirect ?? "/account"`.

- [ ] **Step 1: Modify `LoginPage`**

In `src/app/(frontend)/[locale]/login/page.tsx`:

- Add `redirect?: string;` to the `searchParams` type.
- Import `isSafeLocalPath` from `@/lib/login-redirect`.
- Compute `const redirectTo = params.redirect && isSafeLocalPath(params.redirect) ? params.redirect : null;` after `const params = await searchParams;`.
- Change the already-logged-in redirect from `redirect("/")` to `redirect(redirectTo ?? "/")`.
- Pass `redirect={redirectTo}` to `<LoginForm>`.

The resulting component body:

```tsx
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    verified?: string;
    reset?: string;
    error?: string;
    reason?: string;
    redirect?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const redirectTo =
    params.redirect && isSafeLocalPath(params.redirect) ? params.redirect : null;
  if (user) redirect(redirectTo ?? "/");
  return (
    <LoginForm
      showVerified={params.verified === "true"}
      showReset={params.reset === "true"}
      oauthError={
        params.error === "oauth" ? params.reason || "generic" : undefined
      }
      redirect={redirectTo}
    />
  );
}
```

- [ ] **Step 2: Modify `LoginForm`**

In `src/components/LoginForm.tsx`:

- Add `redirect?: string | null` to the props type.
- Destructure `redirect` from props.
- In `onSubmit`, change `router.push("/account");` to `router.push(redirect ?? "/account");`.

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no output (pass).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/[locale]/login/page.tsx" src/components/LoginForm.tsx
git commit -m "feat: support redirect-back after login"
```

---

### Task 5: Embed review form on the place page

**Files:**
- Modify: `src/app/(frontend)/[locale]/places/[slug]/page.tsx`

**Interfaces:**
- Consumes:
  - `ReviewForm` from `@/components/ReviewForm` (props: `placeId: string`, `placeSlug: string`, `existing?: { rating: number; text: string }`).
  - `Review` type from `@/payload-types`.
  - `getCurrentUser` from `@/lib/session` (already imported).
- Produces: place page renders a "Write a review" section (heading `t("writeReview")`) containing the form, placed between the main info card and the reviews grid. The old `Write a review` button `<Link>` is removed.

- [ ] **Step 1: Read the current file**

Read `src/app/(frontend)/[locale]/places/[slug]/page.tsx`. Note: `place` is typed as `Place`; `reviews` query at lines ~76-88 fetches published reviews with `overrideAccess: true`.

- [ ] **Step 2: Add imports**

Add to imports:

```ts
import { ReviewForm } from "@/components/ReviewForm";
import type { Review } from "@/payload-types";
```

- [ ] **Step 3: Fetch the current user's existing review**

After the `reviews` query block and before `return`, add (only querying when `user` exists):

```ts
const existingReview = user
  ? (
      await payload.find({
        collection: "reviews",
        where: {
          and: [
            { place: { equals: place.id } },
            { author: { equals: user.id } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })
    ).docs[0] as Review | undefined
  : undefined;
```

- [ ] **Step 4: Render the form section and remove the old button**

Remove the old button block (currently a `<div className="mt-6 pt-6 border-t ...">` containing the `Write a review` `<Link>` to `/places/${slug}/review`).

Immediately before the reviews grid (`<div className="grid grid-cols-1 md:grid-cols-3 gap-8">`), insert:

```tsx
<section className="space-y-4">
  <h2 className="font-bold text-xl tracking-tight">{t("writeReview")}</h2>
  <ReviewForm
    placeId={place.id}
    placeSlug={place.slug}
    existing={
      existingReview
        ? { rating: existingReview.rating, text: existingReview.text }
        : undefined
    }
  />
</section>
```

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no output (pass).

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(frontend)/[locale]/places/[slug]/page.tsx"
git commit -m "feat: render review form inline on place page"
```

---

### Task 6: Remove the separate review route

**Files:**
- Delete: `src/app/(frontend)/[locale]/places/[slug]/review/page.tsx` and the whole `review/` folder.

**Interfaces:**
- Consumes: nothing.
- Produces: the `/places/[slug]/review` route no longer exists; all links to it were removed in Task 5.

- [ ] **Step 1: Confirm no remaining references**

Run: `rg -n "/review" src --glob '!**/review/page.tsx'`
Expected: no output (no lingering links to the route).

- [ ] **Step 2: Delete the route folder**

Run: `rm -r "src/app/(frontend)/[locale]/places/[slug]/review"`

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no output (pass).

Run: `pnpm exec vitest run`
Expected: PASS — all existing + new tests.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove separate review page"
```

---

## Self-Review Notes

- **Spec coverage:** Placement (Task 5), login flow (Tasks 3-4), draft preservation (Tasks 1, 3), edit mode (Task 5 existing prop), cleanup (Task 6) all map to spec sections. Out-of-scope items (photo persistence, action changes) are untouched.
- **Type consistency:** `ReviewDraft`/`DraftStorage` defined in Task 1 and used in Task 3; `isSafeLocalPath` defined in Task 2, used in Task 4; `existing` prop shape matches `ReviewForm`'s existing prop type.
