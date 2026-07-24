# Qiimale MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Trustpilot-like review platform for Somalia — browse/search places, read & write reviews with stars + photos + upvotes, admin moderation — as a PWA, bilingual (Somali default + English), built on the existing Next.js 16 + Payload 3 + MongoDB boilerplate.

**Architecture:** Payload-native monolith. Payload collections own data + access control + the stats hooks; the Payload admin panel doubles as the moderation dashboard. Frontend reads use Payload Local API inside Next Server Components; writes go through Next Server Actions that call Local API (auth via the `payload-token` cookie). next-intl handles bilingual routing with `/[locale]/` under `app/(frontend)/` (`so` unprefixed, `/en` per `localePrefix: 'as-needed'`). Next 16 middleware is `proxy.ts`.

**Tech Stack:** Next.js 16.2, React 19, Payload CMS 3.85, MongoDB (Atlas), Tailwind v4 + shadcn, next-intl (latest), zod 4, vitest, Cloudflare R2 (`@payloadcms/storage-r2`).

## Global Constraints

- **Package manager:** `pnpm` (per repo `AGENTS.md`). Never use npm/yarn.
- **Lint/format:** `pnpm lint` (Biome) and `pnpm format` must pass before commits; `pnpm lint` also runs accessibility checks — keep it green.
- **Types:** Payload types auto-generate in dev / on `payload build`; do NOT run `pnpm generate:types` manually while dev server is running.
- **Next.js 16 breaking changes (per repo `AGENTS.md`):** middleware is now **`proxy.ts`** at repo root (Next renamed it); `cookies()` from `next/headers` is **async** (must `await cookies()`); server actions live in `'use server'` files; cookie name for Payload auth = `payload-token`. Reference is `node_modules/next/dist/docs/`.
- **Payload Local API security:** operations done on behalf of a user pass `user` **and** `overrideAccess: false`; system operations (stats hooks) may override deliberately. Thread `req` through nested operations in hooks; guard hooked write-backs with a `req.context` flag to avoid loops.
- **Locale list:** `['so', 'en']`, default `so`. Payload `localization.locales = ['so','en']`, `defaultLocale = 'so'`.
- **Naming:** review = `qiimayn` (plural `qiimayno`), place = `goob` (plural `goobo`), category = `qayb`, city = `magaalada`. UI strings live in `messages/so.json` + `messages/en.json`; **Somali copy must be reviewed by a native speaker before launch** (a task below marks this).
- **No git commits unless the task step explicitly says "Commit"** — and only the files that task touched.

---

## File Structure

```
docs/superpowers/specs/2026-07-24-qiimale-mvp-design.md   # spec (exists)
docs/superpowers/plans/2026-07-24-qiimale-mvp.md          # THIS plan

src/
  proxy.ts                          # next-intl proxy (Next 16 middleware rename)
  i18n/
    routing.ts                     # defineRouting locales + localePrefix as-needed
    request.ts                     # getRequestConfig -> locale + messages
  messages/so.json, messages/en.json   # UI dictionaries (project root, next-intl default)
  payload.config.ts                 # + localization, importMap.baseDir, storage plugin, verify email URL
  access/
    isAdmin.ts                      # FIXED: role-based (was stub Boolean(user))
    isAdminOrSelf.ts                # FIXED: admin OR self (was self-only)
    publishedPlaces.ts               # public reads status:approved; admins all; submitter own
    authenticated.ts                 # logged-in boolean gate
    verifiedOnly.ts                  # _verified gate for reviews/upvotes/flags create
  collections/
    Users.ts                         # extended: role, verify:true
    Categories.ts                    # rewritten: localized name, native slug, icon
    Cities.ts                        # new: localized name, native slug
    Places.ts                        # new
    Reviews.ts                       # new + stats hooks
    ReviewUpvotes.ts                 # new
    Flags.ts                         # new
    Media.ts                         # new upload collection
    Posts.ts                         # DELETED (sample)
  hooks/
    recomputePlaceStats.ts           # afterChange/afterDelete on reviews -> ratingAvg/count
    recomputeUpvoteCount.ts          # afterChange/afterDelete on upvotes
  lib/
    get-payload.ts                   # exists
    reviews-logic.ts                 # PURE functions (tested)
    reviews-logic.test.ts            # vitest
    types.ts                         # ActionResult, ErrorCode
    actions/
      auth.ts                        # register/login/logout/verify
      reviews.ts                     # submitReview
      upvotes.ts                     # toggleUpvote
      flags.ts                       # flagReview
      places.ts                      # addPlace
    i18n.ts                          # helpers: getCurrentUser, auth helpers
  app/
    (frontend)/[locale]/
      layout.tsx
      page.tsx                          # home
      search/page.tsx
      place/[slug]/page.tsx
      place/[slug]/review/page.tsx
      add-place/page.tsx
      login/page.tsx, register/page.tsx, verify/page.tsx
      account/page.tsx
      components/                        # per-route client/server pieces
        Header.tsx, LanguageSwitcher.tsx, StarRating.tsx, PlaceCard.tsx,
        ReviewCard.tsx, ReviewForm.tsx, FlagButton.tsx, UpvoteButton.tsx
    (payload)/...                        # exists (untouched)
    manifest.ts                          # PWA manifest route
  public/icons/                          # PWA icons (existing favicon stays at favicon.ico)
message dictionaries live at repo-root `messages/` (next-intl default path).
vitest.config.ts
.env.example         # document new env vars
```

**Decisions locked here (cross-task contracts):**

- Pure logic module `src/lib/reviews-logic.ts` exports: `computeStats(ratings: number[]): { count: number; avg: number }`, `hasExistingReview(reviews: { author: string | { id: string } }[], userId: string): boolean`, `canUpvote(reviewAuthorId: string, currentUserId: string): boolean`, `canPublishReview(user: { _verified?: boolean } | null): boolean`. Every later task importing these uses exactly these names/signatures.
- Shared result type in `src/lib/types.ts`: `export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: { code: ErrorCode; message: string } }` and `type ErrorCode = 'UNAUTHENTICATED' | 'UNVERIFIED' | 'NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_FLAGGED' | 'SELF_UPVOTE' | 'VALIDATION' | 'CONFLICT'`. Server actions return `Promise<ActionResult<T>>`.
- Auth cookie name everywhere = `payload-token`. Helper `setSessionCookie(cookieStore, token)` in `src/lib/types.ts` writes the standard httpOnly cookie.

---

## Task 1: Dependencies + next-intl scaffolding

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/request.ts`, `messages/so.json`, `messages/en.json`, `src/proxy.ts`
- Modify: `next.config.ts`, `package.json` (via pnpm), `.env.example`
- Test: `src/lib/reviews-logic.test.ts` is created in Task 2; here we only verify build.

**Interfaces:**
- Produces: `routing` object (`{ locales, defaultLocale, localePrefix, pathnames? }`), `getRequestConfig` export, `withNextIntl` wrapping `next.config.ts`, `src/proxy.ts` default-exporting next-intl's proxy with a matcher excluding `/admin`, `/api`.

- [ ] **Step 1: Install runtime + dev deps**

```bash
pnpm add next-intl
pnpm add -D vitest
```

(R2 plugin is added in Task 6 with Media.)

- [ ] **Step 2: Create `src/i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['so', 'en'],
  defaultLocale: 'so',
  localePrefix: 'as-needed',
});
```

- [ ] **Step 3: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Create `messages/so.json`** (full dictionary v1; **Somali strings to be reviewed by a native Somali speaker before launch** — see Task 22)

```json
{
  "App": { "name": "Qiimale", "tagline": "Qiimayn goobo & adeegyo Soomaaliya" },
  "Nav": {
    "home": "Bogga Hore",
    "search": "Raadi",
    "addPlace": "Ku dar goob",
    "account": "Akoonkayga",
    "login": "Geli",
    "logout": "Ka bax",
    "language": "English"
  },
  "Search": {
    "placeholder": "Raadi goob ama adeeg...",
    "results": "Natiijooyinka",
    "empty": "Wax goob ah lama helin.",
    "allCities": "Dhamaan magaalooyinka",
    "allCategories": "Dhamaan qaybaha"
  },
  "Place": {
    "reviews": "{count, plural, one {# qiimayn} other {# qiimayn}}",
    "noReviews": "Wax qiimayn ah weli ma jirto.",
    "noReviewsHint": "Noqo qofka u hor ee qiimaynka!",
    "rating": "Cabbir guud",
    "writeReview": "Qor qiimayn",
    "editReview": "Wax ka beddel qiimayntaada",
    "pending": "Goobtaada waa la sugayaa oggolaanshaha maamulka.",
    "address": "Cinwaan",
    "approved": "La oggolaaday"
  },
  "Review": {
    "rating": "Xiddig",
    "comment": "Faallo",
    "commentPlaceholder": "Sheeg sida aad ku aragto adeegga...",
    " minLength": "Faallada waa in ay noqoto ugu yaraan 20 xaraf.",
    "photos": "Sawiro (ila 3)",
    "submit": "Soo gudbi",
    "upvote": "Taageer",
    "upvoted": "Waad taageertay",
    "flag": "Calaamad",
    "flagged": "Waad calaamadeysay",
    "selfUpvote": "Qiimayntaada ma taageeri kartid.",
    "alreadyFlagged": "Hadii aad horay u calaamadaysay.",
    "by": "{name}",
    "sortRecent": "Ugu dambeeya",
    "sortTop": "Ugu taageer badan",
    "sortHigh": "Ugu sarreya",
    "sortLow": "Ugu hooseya",
    "delete": "Tirtir",
    "confirmDelete": "Ma hubtaa in aad tirtirayso qiimayntaada?"
  },
  "Auth": {
    "register": "Diiwaan geli",
    "login": "Geli akoonka",
    "email": "Iimayl",
    "password": "Erey sir ah",
    "name": "Magacaaga",
    "google": "Soo geli Google-ga",
    "verifyEmail": "Furi iimaylka si aad qiimayn u qortid.",
    "emailSent": "Waxaanu ku soo dirnay iimayl xaqiijin ah.",
    "verifySuccess": "Iimaylkaaga waa la xaqiijiyay. Hadda waxaad qori kartaa qiimayn.",
    "verifyFail": "Xaqiijinta ayaa fashilantay.",
    "noAccount": "Ma leedahay akoon? Diiwaan geli.",
    "haveAccount": "Akoon ma leedahay? Soo geli."
  },
  "Account": {
    "myReviews": "Qiimaynkaaga",
    "myPlaces": "Goobooyinkaaga",
    "statusPending": "Sugitaan",
    "statusApproved": "La oggolaaday"
  },
  "Flag": {
    "title": "Calaamad qiimayntan",
    "reason": "Sababta",
    "fake": "Been abuur",
    "offensive": "Caajib xumo",
    "spam": "Spam",
    "coi": "Khilaaf mudnaan",
    "other": "Kale",
    "note": "Faallo (ixtiyaac)",
    "submit": "Calaamad"
  },
  "AddPlace": {
    "title": "Ku dar goob cusub",
    "name": "Magaca goobta",
    "category": "Qayb",
    "city": "Magaalada",
    "address": "Cinwaan (ixtiyaac)",
    "description": "Faahfaahin (ixtiyaac)",
    "submit": "Soo gudbi",
    "success": "Mahadsanid! Goobka waa la soo gudbiyay, maamulku ayaa hubin doona."
  },
  "Errors": {
    "UNAUTHENTICATED": "Fadlan hore u geli.",
    "UNVERIFIED": "Furi iimaylkaaga kahor qiimayn qoridda.",
    "NOT_FOUND": "Lama helin.",
    "FORBIDDEN": "Lama oggola.",
    "ALREADY_FLAGGED": "Hadii aad horay u calaamadaysay.",
    "SELF_UPVOTE": "Qiimayntaada ma taageeri kartid.",
    "VALIDATION": "Xog aan saxnayn.",
    "CONFLICT": "Khilaaf ah."
  }
}
```

- [ ] **Step 5: Create `messages/en.json`** (same keys)

```json
{
  "App": { "name": "Qiimale", "tagline": "Review Somali places & services" },
  "Nav": {
    "home": "Home",
    "search": "Search",
    "addPlace": "Add a place",
    "account": "My account",
    "login": "Log in",
    "logout": "Log out",
    "language": "Soomaali"
  },
  "Search": {
    "placeholder": "Search a place or service...",
    "results": "Results",
    "empty": "No places found.",
    "allCities": "All cities",
    "allCategories": "All categories"
  },
  "Place": {
    "reviews": "{count, plural, one {# review} other {# reviews}}",
    "noReviews": "No reviews yet.",
    "noReviewsHint": "Be the first to review!",
    "rating": "Overall rating",
    "writeReview": "Write a review",
    "editReview": "Edit your review",
    "pending": "Your place is awaiting admin approval.",
    "address": "Address",
    "approved": "Approved"
  },
  "Review": {
    "rating": "Stars",
    "comment": "Comment",
    "commentPlaceholder": "Tell us how you experienced the service...",
    "minLength": "Comment must be at least 20 characters.",
    "photos": "Photos (up to 3)",
    "submit": "Submit",
    "upvote": "Agree",
    "upvoted": "You agreed",
    "flag": "Flag",
    "flagged": "You flagged this",
    "selfUpvote": "You can't upvote your own review.",
    "alreadyFlagged": "You already flagged this review.",
    "by": "{name}",
    "sortRecent": "Most recent",
    "sortTop": "Most helpful",
    "sortHigh": "Highest",
    "sortLow": "Lowest",
    "delete": "Delete",
    "confirmDelete": "Delete your review?"
  },
  "Auth": {
    "register": "Sign up",
    "login": "Log in",
    "email": "Email",
    "password": "Password",
    "name": "Your name",
    "google": "Continue with Google",
    "verifyEmail": "Verify your email before reviewing.",
    "emailSent": "We sent you a verification email.",
    "verifySuccess": "Your email is verified. You can review now.",
    "verifyFail": "Verification failed.",
    "noAccount": "No account? Sign up.",
    "haveAccount": "Have an account? Log in."
  },
  "Account": {
    "myReviews": "My reviews",
    "myPlaces": "My places",
    "statusPending": "Pending",
    "statusApproved": "Approved"
  },
  "Flag": {
    "title": "Flag this review",
    "reason": "Reason",
    "fake": "Fake",
    "offensive": "Offensive",
    "spam": "Spam",
    "coi": "Conflict of interest",
    "other": "Other",
    "note": "Note (optional)",
    "submit": "Flag"
  },
  "AddPlace": {
    "title": "Add a new place",
    "name": "Place name",
    "category": "Category",
    "city": "City",
    "address": "Address (optional)",
    "description": "Description (optional)",
    "submit": "Submit",
    "success": "Thanks! Your place was submitted and is pending admin review."
  },
  "Errors": {
    "UNAUTHENTICATED": "Please log in first.",
    "UNVERIFIED": "Verify your email before reviewing.",
    "NOT_FOUND": "Not found.",
    "FORBIDDEN": "Not allowed.",
    "ALREADY_FLAGGED": "You already flagged this review.",
    "SELF_UPVOTE": "You can't upvote your own review.",
    "VALIDATION": "Invalid data.",
    "CONFLICT": "Conflict."
  }
}
```

- [ ] **Step 6: Create `src/proxy.ts`** (Next 16 renamed middleware → proxy)

```ts
import createNextIntlProxy from 'next-intl/proxy';
import { routing } from './i18n/routing';

export default createNextIntlProxy(routing);

export const config = {
  matcher: ['/((?!admin|api|_next|favicon.ico|.*\\..*).*)'],
};
```

> If `next-intl` v4 does not ship `next-intl/proxy`, fall back to `createMiddleware` from `next-intl/middleware` exported as `default`. Verify with: `pnpm exec node -e "require('next-intl/proxy')"`.

- [ ] **Step 7: Compose `next.config.ts` with next-intl plugin**

Replace file content:

```ts
import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withPayload(withNextIntl(nextConfig));
```

- [ ] **Step 8: Document env vars in `.env.example`**

Append:

```env
# next-intl (no var needed; routing is code-based)
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Cloudflare R2 (leave empty in dev for local-disk uploads)
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_PUBLIC_URL=
# Payload server URL (used in OAuth + verification email)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

- [ ] **Step 9: Verify build compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. (If `next-intl/proxy` import fails, switch the proxy import per the step 6 note.)

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(i18n): scaffold next-intl with proxy.ts (Next 16) and bilingual dictionaries"
```

---

## Task 2: Vitest setup + pure review logic with tests (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/reviews-logic.ts`, `src/lib/reviews-logic.test.ts`, `src/lib/types.ts`
- Test: `src/lib/reviews-logic.test.ts`

**Interfaces:**
- Produces: `computeStats`, `hasExistingReview`, `canUpvote`, `canPublishReview` (names/signatures frozen — see File Structure).

- [ ] **Step 1: Write failing tests**

`src/lib/reviews-logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  computeStats,
  hasExistingReview,
  canUpvote,
  canPublishReview,
} from './reviews-logic';

describe('computeStats', () => {
  it('averages ratings and counts published reviews', () => {
    expect(computeStats([5, 3, 4])).toEqual({ count: 3, avg: 4 });
  });
  it('rounds avg to 2 decimals', () => {
    expect(computeStats([5, 4, 4])).toEqual({ count: 3, avg: 4.33 });
  });
  it('handles empty list', () => {
    expect(computeStats([])).toEqual({ count: 0, avg: 0 });
  });
  it('handles single review', () => {
    expect(computeStats([2])).toEqual({ count: 1, avg: 2 });
  });
});

describe('hasExistingReview', () => {
  it('true when a review by the user already exists for the place', () => {
    expect(
      hasExistingReview([{ author: 'u1' }, { author: 'u2' }], 'u1'),
    ).toBe(true);
  });
  it('false when the user has no review', () => {
    expect(
      hasExistingReview([{ author: 'u1' }, { author: 'u2' }], 'u3'),
    ).toBe(false);
  });
  it('handles undefined list', () => {
    expect(hasExistingReview(undefined, 'u1')).toBe(false);
  });
});

describe('canUpvote', () => {
  it('rejects self-upvote', () => {
    expect(canUpvote('u1', 'u1')).toBe(false);
  });
  it('allows upvoting others', () => {
    expect(canUpvote('u1', 'u2')).toBe(true);
  });
});

describe('canPublishReview', () => {
  it('requires a verified user', () => {
    expect(canPublishReview(null)).toBe(false);
    expect(canPublishReview({ _verified: false })).toBe(false);
    expect(canPublishReview({ _verified: true })).toBe(true);
    expect(canPublishReview({} as any)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/lib/reviews-logic.test.ts`
Expected: FAIL — module `./reviews-logic` not found.

- [ ] **Step 3: Create `vitest.config.ts`** (minimal; pure tests need only `@/*` alias)

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 4: Write `src/lib/types.ts`** (shared result + cookie helper)

```ts
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNVERIFIED'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'ALREADY_FLAGGED'
  | 'SELF_UPVOTE'
  | 'VALIDATION'
  | 'CONFLICT';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } };

export const SESSION_COOKIE = 'payload-token';

export function setSessionCookie(
  cookies: Awaited<ReturnType<typeof import('next/headers')['cookies']>>,
  token: string,
) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7200,
  });
}

export function clearSessionCookie(
  cookies: Awaited<ReturnType<typeof import('next/headers')['cookies']>>,
) {
  cookies.delete(SESSION_COOKIE);
}

export function error(code: ErrorCode, message: string): ActionResult<never> {
  return { ok: false, error: { code, message } };
}
```

- [ ] **Step 5: Write minimal implementation `src/lib/reviews-logic.ts`**

```ts
export function computeStats(ratings: number[]): { count: number; avg: number } {
  if (!ratings.length) return { count: 0, avg: 0 };
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = Math.round((sum / ratings.length) * 100) / 100;
  return { count: ratings.length, avg };
}

export function hasExistingReview(
  reviews: { author: string | { id: string } }[] | undefined | null,
  userId: string,
): boolean {
  if (!reviews) return false;
  return reviews.some((r) =>
    typeof r.author === 'string' ? r.author === userId : r.author.id === userId,
  );
}

export function canUpvote(reviewAuthorId: string, currentUserId: string): boolean {
  return reviewAuthorId !== currentUserId;
}

export function canPublishReview(user: { _verified?: boolean } | null): boolean {
  return Boolean(user?._verified);
}
```

- [ ] **Step 6: Add npm script**

In `package.json` add under `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Run tests to verify pass**

Run: `pnpm test`
Expected: 4 describe blocks pass (8 assertions).

- [ ] **Step 8: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(test): add vitest and pure review rules (stats, one-per-user, upvote, verify gate)"
```

---

## Task 3: Payload config — localization, importMap, drop Posts

**Files:**
- Modify: `src/payload.config.ts`, `src/collections/Categories.ts`, `src/collections/Users.ts` (Users touched in Task 4; here only remove Posts)
- Delete: `src/collections/Posts.ts`, `src/access/isAdminOrEditor.ts`

**Interfaces:**
- Produces: `payload.config.ts` exporting a config with `localization` (so/en) and `admin.importMap.baseDir` pointing at the existing importMap location; collections array contains Users, Categories (only for now).

- [ ] **Step 1: Delete Posts and unused accessor**

```bash
rm src/collections/Posts.ts src/access/isAdminOrEditor.ts
```

- [ ] **Step 2: Rewrite `src/payload.config.ts`**

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Categories } from './collections/Categories';
import { Users } from './collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  collections: [Users, Categories],
  localization: {
    locales: ['so', 'en'],
    defaultLocale: 'so',
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  db: mongooseAdapter({ url: process.env.DATABASE_URL || '' }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
});
```

> `importMap.baseDir` points to `src/` so Payload generates the import map at the existing `src/app/(payload)/admin/importMap.js`. The `(payload)` importMap.js already loads `@payload-config`.

- [ ] **Step 3: Verify typecheck + regenerate importMap**

Run: `pnpm generate:importmap && pnpm exec tsc --noEmit`
Expected: imports regenerate without error; `tsc` passes.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(payload): add localization, fix importMap baseDir, remove sample Posts collection"
```

---

## Task 4: Users collection + access-control rewrite

**Files:**
- Modify: `src/collections/Users.ts`, `src/access/isAdmin.ts`, `src/access/isAdminOrSelf.ts`
- Create: `src/access/authenticated.ts`, `src/access/verifiedOnly.ts`

**Interfaces:**
- Produces: `Users` config with `auth: { verify: { generateEmailURL: ... } }`, `role` select + `saveToJWT`, existing `name` field (reused, not renamed); updated `isAdmin` (role-based) and `isAdminOrSelf` (admin OR self).

- [ ] **Step 1: Rewrite `src/access/isAdmin.ts`** (the template stub just checked `Boolean(user)` — wrong)

```ts
import type { Access, FieldAccess } from 'payload';
import type { User } from '@/payload-types';

export const isAdmin: Access = ({ req: { user } }) => {
  return (user as User | null)?.role === 'admin';
};

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  return (user as User | null)?.role === 'admin';
};
```

- [ ] **Step 2: Rewrite `src/access/isAdminOrSelf.ts`

```ts
import type { Access, FieldAccess } from 'payload';
import type { User } from '@/payload-types';

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  const u = user as User | null;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return { id: { equals: u.id } };
};

export const isAdminOrSelfFieldLevel: FieldAccess = ({ id, req: { user } }) => {
  const u = user as User | null;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return u.id === id;
};
```

- [ ] **Step 3: Create `src/access/authenticated.ts`**

```ts
import type { Access } from 'payload';

export const authenticated: Access = ({ req: { user } }) => Boolean(user);
```

- [ ] **Step 4: Create `src/access/verifiedOnly.ts`**

```ts
import type { Access } from 'payload';
import type { User } from '@/payload-types';

export const verifiedOnly: Access = ({ req: { user } }) =>
  Boolean((user as User | null)?._verified);
```

- [ ] **Step 5: Rewrite `src/collections/Users.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/isAdmin';
import { isAdminOrSelf } from '../access/isAdminOrSelf';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailURL: ({ token }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/verify?token=${token}`,
    },
  },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role', '_verified'] },
  access: {
    read: () => true,
    create: () => true,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'reviewer'],
      defaultValue: 'reviewer',
      required: true,
      saveToJWT: true,
      admin: { position: 'sidebar' },
    },
  ],
};
```

- [ ] **Step 6: Regenerate types + typecheck**

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS. `payload-types.ts` now has `role` and `_verified` (built-in auth field) on `User`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(users): role-based access, email verification, fix isAdmin/isAdminOrSelf stubs"
```

---

## Task 5: Categories + Cities collections

**Files:**
- Modify: `src/collections/Categories.ts`
- Create: `src/collections/Cities.ts`
- Modify: `src/payload.config.ts` (add Cities)

**Interfaces:**
- Produces: `categories` collection (localized `name`, native `slug`, `icon`), `cities` collection (localized `name`, native `slug`). Both: read=anyone, write=admin.

- [ ] **Step 1: Rewrite `src/collections/Categories.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/isAdmin';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name', admin: { position: 'sidebar' } },
    {
      name: 'icon',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'lucide icon name, e.g. utensils, graduation-cap',
      },
    },
  ],
};
```

- [ ] **Step 2: Create `src/collections/Cities.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/isAdmin';

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name', admin: { position: 'sidebar' } },
  ],
};
```

- [ ] **Step 3: Register Cities + (re)register localization (already set) in `src/payload.config.ts`**

Edit the `collections` array:
```ts
collections: [Users, Categories, Cities],
```
Add the Cities import at top:
```ts
import { Cities } from './collections/Cities';
```

- [ ] **Step 4: Regenerate types + typecheck**

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS; `Category` and `City` types include `slug` and localized `name`.

- [ ] **Step 5: Manual seed via /admin** (no code — see Global Constraints)

Run `pnpm dev`, open `http://localhost:3000/admin`, add these categories (English + Somali names; set `icon`): restaurants (`utensils`), universities (`graduation-cap`), hospitals (`plus`), companies (`building-2`), educational centers (`school`), hotels (`bed`), government services (`landmark`), shops (`shopping-bag`), other (`more-horizontal`).
Add cities: Mogadishu, Hargeisa, Garowe, Kismayo, Baidoa, Berbera, Bosaso, Galkayo, Dhusamareb, Jowhar (Somali name = same; English name = same).

> Seeding is admin data entry — not code, so no commit step. Move on.

---

## Task 6: Media collection + Cloudflare R2 storage plugin

**Files:**
- Create: `src/collections/Media.ts`
- Modify: `src/payload.config.ts` (register Media + conditional R2 plugin)
- Modify: `package.json` (`pnpm add @payloadcms/storage-r2`)

**Interfaces:**
- Produces: `media` upload collection (webp, thumbnail 400 + card 800, images only); `r2Storage` plugin active only when `R2_BUCKET` is set.

- [ ] **Step 1: Install the plugin**

```bash
pnpm add @payloadcms/storage-r2
```

- [ ] **Step 2: Create `src/collections/Media.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { authenticated } from '../access/authenticated';
import { isAdmin } from '../access/isAdmin';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename' },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: isAdmin,
  },
  upload: {
    mimeTypes: ['image/*'],
    formatOptions: { format: 'webp' },
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, height: 800, position: 'centre' },
    ],
  },
  fields: [{ name: 'alt', type: 'text' }],
};
```

- [ ] **Step 3: Register Media + conditional R2 plugin in `src/payload.config.ts`**

Add imports:
```ts
import { Media } from './collections/Media';
import { r2Storage } from '@payloadcms/storage-r2';
```
Update collections:
```ts
collections: [Users, Categories, Cities, Media],
```
Add plugins (after `sharp,` but inside `buildConfig({...})`):
```ts
plugins: [
  ...(process.env.R2_BUCKET
    ? [
        r2Storage({
          collections: { media: true },
          bucket: process.env.R2_BUCKET,
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT || '',
          },
        }),
      ]
    : []),
],
```

- [ ] **Step 4: Regenerate types + typecheck**

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS; `Media` in `payload-types.ts`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(media): upload collection with webp sizes and optional R2 storage"
```

---

## Task 7: Places collection

**Files:**
- Create: `src/collections/Places.ts`, `src/access/publishedPlaces.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Produces: `places` collection with `status` pending/approved/rejected, `submittedBy`, cached `ratingAvg`/`reviewCount`. Public reads see `status: approved` only (admin/submitter exempt). `recomputePlaceStats` hook (Task 8) writes `ratingAvg`/`reviewCount`.

- [ ] **Step 1: Create `src/access/publishedPlaces.ts`**

```ts
import type { Access } from 'payload';
import type { User } from '@/payload-types';

export const publishedPlaces: Access = ({ req: { user } }) => {
  const u = user as User | null;
  if (u?.role === 'admin') return true;
  const base = { status: { equals: 'approved' } };
  if (u) return { or: [base, { submittedBy: { equals: u.id } }] };
  return base;
};
```

- [ ] **Step 2: Create `src/collections/Places.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/isAdmin';
import { authenticated } from '../access/authenticated';
import { publishedPlaces } from '../access/publishedPlaces';

export const Places: CollectionConfig = {
  slug: 'places',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'city', 'status', 'reviewCount', 'ratingAvg'],
  },
  access: {
    read: publishedPlaces,
    create: authenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name', admin: { position: 'sidebar' } },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'address', type: 'text' },
    { name: 'description', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'approved', 'rejected'],
      defaultValue: 'pending',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'ratingAvg',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  indexes: [
    { fields: ['category'] },
    { fields: ['city'] },
    { fields: ['status'] },
    { fields: ['ratingAvg'] },
  ],
};
```

- [ ] **Step 3: Register in `src/payload.config.ts`**

Add import + include in `collections`:
```ts
import { Places } from './collections/Places';
...
collections: [Users, Categories, Cities, Media, Places],
```

- [ ] **Step 4: Regenerate types + typecheck**

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS; `Place` type present.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(places): places collection with status lifecycle and cached stats fields"
```

---

## Task 8: Reviews collection + stats hooks

**Files:**
- Create: `src/collections/Reviews.ts`, `src/hooks/recomputePlaceStats.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Consumes: `computeStats` from `src/lib/reviews-logic.ts`.
- Produces: `reviews` collection wired with `afterChange` and `afterDelete` hooks that recompute `places.ratingAvg`/`places.reviewCount` over `status: published` reviews. Hook writes back with `overrideAccess: true` (system operation) and a `req.context.skipStats` flag to prevent loops.

- [ ] **Step 1: Create `src/hooks/recomputePlaceStats.ts`**

```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { computeStats } from '../lib/reviews-logic';

async function resync(args: {
  payload: import('payload').Payload;
  placeId: string;
  req: import('payload').PayloadRequest;
}) {
  if (args.req.context.skipStats) return;
  const res = await args.payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: args.placeId } }, { status: { equals: 'published' } }] },
    depth: 0,
    limit: 0,
    req: args.req,
  });
  const full = await args.payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: args.placeId } }, { status: { equals: 'published' } }] },
    limit: 100000,
    req: args.req,
  });
  const stats = computeStats(full.docs.map((d) => d.rating));
  await args.payload.update({
    collection: 'places',
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
  operation,
}) => {
  const placeId = typeof doc.place === 'string' ? doc.place : doc.place?.id;
  if (!placeId) return doc;
  if (operation === 'delete') return doc;
  await resync({ payload: req.payload, placeId, req });
  return doc;
};

export const recomputeOnReviewDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const placeId = doc?.place ? (typeof doc.place === 'string' ? doc.place : doc.place.id) : null;
  if (!placeId) return;
  await resync({ payload: req.payload, placeId, req });
};
```

> Notes: `find` with a per-team filter uses the same query shape as posts; we keep two queries (count + content) only to size stats — `stats` uses the content query, the count query is removed below as YAGNI.

Actually — drop the redundant count query:

```ts
async function resync(args: {
  payload: import('payload').Payload;
  placeId: string;
  req: import('payload').PayloadRequest;
}) {
  if (args.req.context.skipStats) return;
  const full = await args.payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: args.placeId } }, { status: { equals: 'published' } }] },
    limit: 100000,
    req: args.req,
  });
  const stats = computeStats(full.docs.map((d) => d.rating));
  await args.payload.update({
    collection: 'places',
    id: args.placeId,
    data: { ratingAvg: stats.avg, reviewCount: stats.count },
    overrideAccess: true,
    req: args.req,
    context: { skipStats: true },
  });
}
```

(Use this simplified `resync`; delete the first `find`.)

- [ ] **Step 2: Create `src/collections/Reviews.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/isAdmin';
import { isAdminOrSelf } from '../access/isAdminOrSelf';
import { publishedPlaces } from '../access/publishedPlaces';
import { verifiedOnly } from '../access/verifiedOnly';
import { recomputeOnReviewChange, recomputeOnReviewDelete } from '../hooks/recomputePlaceStats';

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'rating',
    defaultColumns: ['rating', 'place', 'author', 'status', 'upvoteCount', 'flagCount'],
  },
  access: {
    read: () => true,
    create: verifiedOnly,
    update: isAdminOrSelf,
    delete: isAdminOrSelf,
  },
  hooks: {
    afterChange: [recomputeOnReviewChange],
    afterDelete: [recomputeOnReviewDelete],
  },
  fields: [
    { name: 'place', type: 'relationship', relationTo: 'places', required: true, index: true },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      validate: (val) => (val >= 1 && val <= 5 ? true : 'Rating must be 1-5'),
    },
    { name: 'text', type: 'textarea', required: true },
    {
      name: 'photos',
      type: 'array',
      maxRows: 3,
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'status',
      type: 'select',
      options: ['published', 'hidden', 'removed'],
      defaultValue: 'published',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'upvoteCount', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'flagCount', type: 'number', defaultValue: 0, index: true, admin: { readOnly: true, position: 'sidebar' } },
  ],
  indexes: [{ fields: ['place', 'author'] }],
};
```

- [ ] **Step 3: Register in `src/payload.config.ts`**

```ts
import { Reviews } from './collections/Reviews';
...
collections: [Users, Categories, Cities, Media, Places, Reviews],
```

- [ ] **Step 4: Regenerate types + typecheck**

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS; `Review` type with `photos.image` as Media relationship.

- [ ] **Step 5: Manual smoke (the integration test for the hook)**

Run `pnpm dev`. In `/admin`: approve a place → create a review (rating 4) on it → re-open the place; verify `reviewCount = 1`, `ratingAvg = 4`. Create a 2nd review (rating 5) → `reviewCount = 2`, `ratingAvg = 4.5`. Set one review `status: hidden` → `reviewCount = 1`, `ratingAvg = 4`. Delete a review → stats recompute again. If a value is wrong, the pure `computeStats` is failing (Task 2 tests guard it) or the hook isn't wired — check `resync` runs.
Expected: stats match by hand.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(reviews): reviews collection + place-stats recompute hooks"
```

---

## Task 9: Upvotes + Flags collections

**Files:**
- Create: `src/collections/ReviewUpvotes.ts`, `src/collections/Flags.ts`, `src/hooks/recomputeUpvoteCount.ts`
- Modify: `src/payload.config.ts`

**Interfaces:**
- Produces: `review-upvotes` (review, user) and `flags` (review, reporter, reason, note, status). `recomputeUpvoteCount` keeps `reviews.upvoteCount` in sync. The `toggleUpvote`/`flagReview` actions (Tasks 12-13) own uniqueness; the collection also enforces uniqueness via a compound index.

- [ ] **Step 1: Create `src/hooks/recomputeUpvoteCount.ts`**

```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

async function resync(args: {
  payload: import('payload').Payload;
  reviewId: string;
  req: import('payload').PayloadRequest;
}) {
  if (args.req.context.skipUpvoteStats) return;
  const res = await args.payload.find({
    collection: 'review-upvotes',
    where: { review: { equals: args.reviewId } },
    limit: 0,
    req: args.req,
  });
  await args.payload.update({
    collection: 'reviews',
    id: args.reviewId,
    data: { upvoteCount: res.totalDocs },
    overrideAccess: true,
    req: args.req,
    context: { skipUpvoteStats: true, skipStats: true },
  });
}

export const recomputeOnUpvoteChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  const reviewId = typeof doc.review === 'string' ? doc.review : doc.review?.id;
  if (reviewId) await resync({ payload: req.payload, reviewId, req });
  return doc;
};

export const recomputeOnUpvoteDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const reviewId = doc?.review ? (typeof doc.review === 'string' ? doc.review : doc.review.id) : null;
  if (reviewId) await resync({ payload: req.payload, reviewId, req });
};
```

- [ ] **Step 2: Create `src/collections/ReviewUpvotes.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { authenticated } from '../access/authenticated';
import { isAdmin } from '../access/isAdmin';
import { recomputeOnUpvoteChange, recomputeOnUpvoteDelete } from '../hooks/recomputeUpvoteCount';

export const ReviewUpvotes: CollectionConfig = {
  slug: 'review-upvotes',
  admin: { useAsTitle: 'review', hidden: true },
  access: {
    read: () => true,
    create: authenticated,
    update: () => false,
    delete: authenticated,
  },
  hooks: {
    afterChange: [recomputeOnUpvoteChange],
    afterDelete: [recomputeOnUpvoteDelete],
  },
  fields: [
    { name: 'review', type: 'relationship', relationTo: 'reviews', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
  ],
  indexes: [{ fields: ['review', 'user'], unique: true }],
};
```

- [ ] **Step 3: Create `src/collections/Flags.ts`**

```ts
import type { CollectionConfig } from 'payload';
import { authenticated } from '../access/authenticated';
import { isAdmin } from '../access/isAdmin';

export const Flags: CollectionConfig = {
  slug: 'flags',
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['review', 'reporter', 'reason', 'status', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: authenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'review', type: 'relationship', relationTo: 'reviews', required: true, index: true },
    { name: 'reporter', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'reason',
      type: 'select',
      options: ['fake', 'offensive', 'spam', 'coi', 'other'],
      required: true,
    },
    { name: 'note', type: 'text' },
    {
      name: 'status',
      type: 'select',
      options: ['open', 'resolved'],
      defaultValue: 'open',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
};
```

- [ ] **Step 4: Register both + importMap regen**

Edit `payload.config.ts` `collections`:
```ts
collections: [Users, Categories, Cities, Media, Places, Reviews, ReviewUpvotes, Flags],
```
Imports:
```ts
import { ReviewUpvotes } from './collections/ReviewUpvotes';
import { Flags } from './collections/Flags';
```

Run: `pnpm generate:types && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(upvotes,flags): join collection, flags queue, upvote-count hook"
```

---

## Task 10: Auth server actions (register/login/logout/verify)

**Files:**
- Create: `src/lib/actions/auth.ts`, `src/lib/session.ts`
- Modify: `src/lib/types.ts` (already has cookie helpers — no change unless needed)

**Interfaces:**
- Consumes: `getPayloadClient` from `@/lib/get-payload`, `ActionResult` + cookie helpers from `@/lib/types`.
- Produces: `registerUser`, `loginUser`, `logoutUser`, `verifyEmail` async server actions returning `ActionResult`. `getCurrentUser(headers)` helper used by components.

- [ ] **Step 1: Create `src/lib/session.ts`** (reads `payload-token` cookie → user, for Server Components)

```ts
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { User } from '@/payload-types';
import { getPayloadClient } from './get-payload';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  return resolveUser(cookieStore);
}

export async function resolveUser(cookieStore: ReadonlyRequestCookies): Promise<User | null> {
  const token = cookieStore.get('payload-token')?.value;
  if (!token) return null;
  const payload = await getPayloadClient();
  const me = await payload.auth({ headers: new Headers({ Cookie: `payload-token=${token}` }) });
  return me.user as User | null;
}
```

- [ ] **Step 2: Create `src/lib/actions/auth.ts`**

```ts
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/get-payload';
import { setSessionCookie, clearSessionCookie, error, type ActionResult } from '@/lib/types';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerUser(input: z.infer<typeof registerSchema> & Record<string, unknown>): Promise<ActionResult<{ message: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION', message: parsed.error.issues[0]?.message || 'Invalid data' } };
  const payload = await getPayloadClient();
  try {
    await payload.create({ collection: 'users', data: parsed.data });
  } catch (e: any) {
    return { ok: false, error: { code: 'CONFLICT', message: e?.message || 'Email already in use' } };
  }
  const cookieStore = await cookies();
  const res = await payload.login({
    collection: 'users',
    data: { email: parsed.data.email, password: parsed.data.password },
  });
  if (!res.token || !res.user) return { ok: false, error: { code: 'VALIDATION', message: 'Registered; please verify your email then log in.' } };
  setSessionCookie(cookieStore, res.token);
  return { ok: true, data: { message: 'registered' } };
}

export async function loginUser(input: z.infer<typeof loginSchema> & Record<string, unknown>): Promise<ActionResult<{ token: string; verified: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return error('VALIDATION', parsed.error.issues[0]?.message || 'Invalid data');
  const payload = await getPayloadClient();
  let res;
  try {
    res = await payload.login({ collection: 'users', data: parsed.data });
  } catch {
    return error('UNAUTHENTICATED', 'Invalid credentials');
  }
  if (!res.token) return error('UNAUTHENTICATED', 'Invalid credentials');
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, res.token);
  return { ok: true, data: { token: res.token, verified: Boolean(res.user?._verified) } };
}

export async function logoutUser(): Promise<ActionResult<true>> {
  const cookieStore = await cookies();
  clearSessionCookie(cookieStore);
  return { ok: true, data: true };
}
```

- [ ] **Step 3: Add `verifyEmail` server action** (the verification email points the user to `/verify?token=...`; this action calls Payload's REST verify endpoint)

Append to `src/lib/actions/auth.ts`:

```ts
export async function verifyEmail(token: string): Promise<ActionResult<true>> {
  if (!token) return error('VALIDATION', 'Missing token');
  const payload = await getPayloadClient();
  const config = payload.collections['users'].config;
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/users/verify/${token}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) return error('VALIDATION', 'Verification failed');
  return { ok: true, data: true };
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (apply the typo fix from step 2).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(auth): register/login/logout/verify server actions"
```

---

## Task 11: Review submit server action

**Files:**
- Create: `src/lib/actions/reviews.ts`

**Interfaces:**
- Consumes: `getPayloadClient`, `getCurrentUser`, `computeStats`-free helpers but `hasExistingReview` + `canPublishReview` from `@/lib/reviews-logic`, `error` from `@/lib/types`.
- Produces: `submitReview(input: { placeId: string; rating: number; text: string; photoIds: string[] })` — verifies user + verified email, enforces one review/place/user (edit semantics), lives in a `'use server'` file. Returns `ActionResult<{ reviewId: string }>` and revalidates the place page.

- [ ] **Step 1: Create `src/lib/actions/reviews.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { canPublishReview, hasExistingReview } from '@/lib/reviews-logic';
import { error, type ActionResult } from '@/lib/types';

const schema = z.object({
  placeId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20),
  photoIds: z.array(z.string()).max(3).optional(),
});

export async function submitReview(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ reviewId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return error('VALIDATION', parsed.error.issues[0]?.message || 'Invalid data');

  const user = await getCurrentUser();
  if (!user) return error('UNAUTHENTICATED', 'Login required');
  if (!canPublishReview(user)) return error('UNVERIFIED', 'Verify email first');

  const payload = await getPayloadClient();
  const place = (await payload.findByID({ collection: 'places', id: parsed.data.placeId, overrideAccess: false, user })) as any;
  if (!place || place.status !== 'approved') return error('NOT_FOUND', 'Place not found');

  const existing = await payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: parsed.data.placeId } }, { author: { equals: user.id } }] },
    limit: 1,
    overrideAccess: false,
    user,
  });

  const data: any = {
    rating: parsed.data.rating,
    text: parsed.data.text,
    status: 'published',
    author: user.id,
    place: parsed.data.placeId,
    photos: (parsed.data.photoIds || []).map((id) => ({ image: id })),
  };

  let reviewId: string;
  if (hasExistingReview(existing.docs as any, user.id)) {
    const id = (existing.docs[0] as any).id;
    const updated = await payload.update({ collection: 'reviews', id, data, overrideAccess: false, user });
    reviewId = (updated as any).id;
  } else {
    const created = await payload.create({ collection: 'reviews', data, overrideAccess: false, user });
    reviewId = (created as any).id;
  }

  revalidatePath(`/place/${place.slug}`);
  return { ok: true, data: { reviewId } };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(reviews): submitReview action with one-per-user and edit semantics"
```

---

## Task 12: Upvote + Flag server actions

**Files:**
- Create: `src/lib/actions/upvotes.ts`, `src/lib/actions/flags.ts`

**Interfaces:**
- Consumes: `canUpvote` (upvotes), `getCurrentUser`, `getPayloadClient`, `error`.
- Produces: `toggleUpvote({ reviewId })` (idempotent toggle, rejects self-upvote) and `flagReview({ reviewId, reason, note? })` (one open flag per user/review, increments `review.flagCount`).

- [ ] **Step 1: Create `src/lib/actions/upvotes.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { canUpvote } from '@/lib/reviews-logic';
import { error, type ActionResult } from '@/lib/types';

const schema = z.object({ reviewId: z.string() });

export async function toggleUpvote(input: z.infer<typeof schema> & Record<string, unknown>): Promise<ActionResult<{ upvoted: boolean }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return error('VALIDATION', 'Invalid data');
  const user = await getCurrentUser();
  if (!user) return error('UNAUTHENTICATED', 'Login required');

  const payload = await getPayloadClient();
  const review = (await payload.findByID({
    collection: 'reviews',
    id: parsed.data.reviewId,
    overrideAccess: true,
  })) as any;
  if (!review) return error('NOT_FOUND', 'Review not found');

  const authorId = typeof review.author === 'string' ? review.author : review.author?.id;
  if (!canUpvote(authorId, user.id)) return error('SELF_UPVOTE', "You can't upvote your own review");

  const placeId = typeof review.place === 'string' ? review.place : review.place?.id;
  let placeSlug: string | undefined;
  if (placeId) {
    const place = (await payload.findByID({ collection: 'places', id: placeId, overrideAccess: true })) as any;
    placeSlug = place?.slug;
  }

  const existing = await payload.find({
    collection: 'review-upvotes',
    where: { and: [{ review: { equals: review.id } }, { user: { equals: user.id } }] },
    limit: 1,
    overrideAccess: false,
    user,
  });
  if (existing.docs.length) {
    await payload.delete({ collection: 'review-upvotes', id: (existing.docs[0] as any).id, overrideAccess: false, user });
    if (placeSlug) revalidatePath(`/place/${placeSlug}`);
    return { ok: true, data: { upvoted: false } };
  }
  await payload.create({
    collection: 'review-upvotes',
    data: { review: review.id, user: user.id },
    overrideAccess: false,
    user,
  });
  if (placeSlug) revalidatePath(`/place/${placeSlug}`);
  return { ok: true, data: { upvoted: true } };
}
```

- [ ] **Step 2: Create `src/lib/actions/flags.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { error, type ActionResult } from '@/lib/types';

const schema = z.object({
  reviewId: z.string(),
  reason: z.enum(['fake', 'offensive', 'spam', 'coi', 'other']),
  note: z.string().max(500).optional(),
});

export async function flagReview(input: z.infer<typeof schema> & Record<string, unknown>): Promise<ActionResult<{ flagId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return error('VALIDATION', parsed.error.issues[0]?.message || 'Invalid data');
  const user = await getCurrentUser();
  if (!user) return error('UNAUTHENTICATED', 'Login required');

  const payload = await getPayloadClient();
  const review = (await payload.findByID({ collection: 'reviews', id: parsed.data.reviewId, overrideAccess: true })) as any;
  if (!review) return error('NOT_FOUND', 'Review not found');

  const open = await payload.find({
    collection: 'flags',
    where: { and: [{ review: { equals: review.id } }, { reporter: { equals: user.id } }, { status: { equals: 'open' } }] },
    limit: 1,
    overrideAccess: false,
    user,
  });
  if (open.docs.length) return error('ALREADY_FLAGGED', 'You already flagged this review');

  const flag = await payload.create({
    collection: 'flags',
    data: { review: review.id, reporter: user.id, reason: parsed.data.reason, note: parsed.data.note || '', status: 'open' },
    overrideAccess: false,
    user,
  });
  await payload.update({
    collection: 'reviews',
    id: review.id,
    data: { flagCount: (review.flagCount || 0) + 1 },
    overrideAccess: true,
    req: {} as any,
  });
  return { ok: true, data: { flagId: (flag as any).id } };
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(upvotes,flags): toggleUpvote and flagReview actions"
```

---

## Task 13: Add-place server action

**Files:**
- Create: `src/lib/actions/places.ts`

**Interfaces:**
- Produces: `addPlace({ name, categoryId, cityId, address?, description? })` — requires login; creates with `status: 'pending'` + `submittedBy: req.user`. Returns `ActionResult<{ placeId: string }>`.

- [ ] **Step 1: Create `src/lib/actions/places.ts`**

```ts
'use server';

import { z } from 'zod';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { error, type ActionResult } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2),
  categoryId: z.string(),
  cityId: z.string(),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export async function addPlace(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ placeId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return error('VALIDATION', parsed.error.issues[0]?.message || 'Invalid data');
  const user = await getCurrentUser();
  if (!user) return error('UNAUTHENTICATED', 'Login required');
  const payload = await getPayloadClient();
  const created = await payload.create({
    collection: 'places',
    data: {
      name: parsed.data.name,
      category: parsed.data.categoryId,
      city: parsed.data.cityId,
      address: parsed.data.address,
      description: parsed.data.description,
      status: 'pending',
      submittedBy: user.id,
    },
    overrideAccess: false,
    user,
  });
  return { ok: true, data: { placeId: (created as any).id } };
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm exec tsc --noEmit` → PASS.
```bash
git add -A && git commit -m "feat(places): addPlace action (pending status)"
```

---

## Task 14: Google OAuth route handlers

**Files:**
- Create: `src/app/api/auth/google/route.ts`, `src/app/api/auth/google/callback/route.ts`
- Modify: `.env.example` (already documented in Task 1)

**Interfaces:**
- Consumes: `getFieldsToSign`, `jwtSign` exported from `payload` root; `getPayloadClient`. Locales-correct redirect back to localized home.
- Produces: `GET /api/auth/google` → 302 to Google consent. `GET /api/auth/google/callback` → verifies ID token, find-or-create user (verified), signs JWT, sets `payload-token` cookie, redirects to `/`.

> These routes live outside `(frontend)/[locale]/` so next-intl's proxy matcher (excludes `/api`) won't run on them. AGENTS.md (Next 16): cookies must be set on `NextResponse` **before** redirecting.

- [ ] **Step 1: Create `src/app/api/auth/google/route.ts`**

```ts
import { NextResponse } from 'next/server';

const SCOPES = ['openid', 'email', 'profile'];

export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'online',
    prompt: 'select_account',
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
```

- [ ] **Step 2: Create `src/app/api/auth/google/callback/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/get-payload';
import { getFieldsToSign, jwtSign } from 'payload';
import { SESSION_COOKIE } from '@/lib/types';
import crypto from 'node:crypto';

async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id_token as string;
}

function decodeIdToken(idToken: string): { email?: string; name?: string } {
  try {
    const payload = idToken.split('.')[1];
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return { email: json.email, name: json.name };
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code');
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
  if (!code) return NextResponse.redirect(`${serverUrl}/login?error=1`);

  const redirectUri = `${serverUrl}/api/auth/google/callback`;
  const idToken = await exchangeCode(code, redirectUri);
  if (!idToken) return NextResponse.redirect(`${serverUrl}/login?error=1`);

  const { email, name } = decodeIdToken(idToken);
  if (!email) return NextResponse.redirect(`${serverUrl}/login?error=1`);

  const payload = await getPayloadClient();
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  let userDoc: any;
  if (users.docs.length) {
    userDoc = users.docs[0];
    if (!userDoc._verified) {
      userDoc = await payload.update({
        collection: 'users',
        id: userDoc.id,
        data: { _verified: true },
        overrideAccess: true,
      });
    }
  } else {
    userDoc = await payload.create({
      collection: 'users',
      data: {
        email,
        name: name || email.split('@')[0],
        password: crypto.randomBytes(32).toString('hex'),
        role: 'reviewer',
        _verified: true,
      },
      overrideAccess: true,
    });
  }

  const collectionConfig = payload.collections['users'].config;
  const fieldsToSign = getFieldsToSign({ collectionConfig, email, user: userDoc });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: process.env.PAYLOAD_SECRET || '',
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  });

  const res = NextResponse.redirect(`${serverUrl}/`);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7200,
  });
  return res;
}
```

> Verify `collectionConfig.auth.tokenExpiration`: in Payload 3.85 it's a number (seconds) on the sanitized collection config; if missing, use `collectionConfig.auth?.tokenExpiration ?? 7200`.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(auth): Google OAuth callback issuing payload JWT cookie"
```

---

## Task 15: Frontend shell — root layout, i18n provider, header, language switcher

**Files:**
- Modify: `src/app/(frontend)/layout.tsx` → move to `src/app/(frontend)/[locale]/layout.tsx`
- Create: `src/app/(frontend)/[locale]/components/Header.tsx`, `LanguageSwitcher.tsx`, `src/app/(frontend)/[locale]/page.tsx` placeholder (filled in Task 16)

**Interfaces:**
- Produces: a localized root layout that sets `<html lang={locale}>`, wraps children in `NextIntlClientProvider`, renders a Header with nav + language switcher + auth state, a footer.

- [ ] **Step 1: Move + rewrite root layout at `src/app/(frontend)/[locale]/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { Header } from './components/Header';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Qiimale',
    description: 'Qiimayn goobo & adeegyo Soomaaliya',
    manifest: '/manifest.webmanifest',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            Qiimale © {new Date().getFullYear()}
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> The old layout at `src/app/(frontend)/layout.tsx` still exists — delete it so there's no duplicate-root-layout conflict (App Router disallows two root layouts). `globals.css` import path is now `./globals.css` from the `[locale]` dir — but the file lives at `src/app/(frontend)/globals.css`; from `[locale]/` that's `../globals.css`.

Use `'../globals.css'` in the import above.

```bash
rm src/app/\(frontend\)/layout.tsx src/app/\(frontend\)/page.tsx
```

- [ ] **Step 2: Create `src/app/(frontend)/[locale]/components/Header.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/session';
import { LanguageSwitcher } from './LanguageSwitcher';
import Link from 'next/link';

export async function Header() {
  const t = await getTranslations('Nav');
  const user = await getCurrentUser();
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">Qiimale</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/search">{t('search')}</Link>
          <Link href="/add-place">{t('addPlace')}</Link>
          {user ? (
            <Link href="/account">{t('account')}</Link>
          ) : (
            <Link href="/login">{t('login')}</Link>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `src/app/(frontend)/[locale]/components/LanguageSwitcher.tsx`**

```tsx
'use client';

import { usePathname } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const next = locale === 'so' ? 'en' : 'so';
    const href = pathname({ locale: next });
    router.replace(href);
  }
  return (
    <button onClick={toggle} className="text-muted-foreground hover:text-foreground">
      {t('language')}
    </button>
  );
}
```

> `next-intl/navigation` exposes `usePathname` that returns a function accepting `{ locale }`. Create `src/i18n/navigation.ts`:

- [ ] **Step 4: Create `src/i18n/navigation.ts`**

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 5: Add minimal home page placeholder at `src/app/(frontend)/[locale]/page.tsx`** (replaced in Task 16)

```tsx
export default function HomePage() {
  return <p className="text-muted-foreground">Qiimale</p>;
}
```

- [ ] **Step 6: Typecheck + build smoke**

Run: `pnpm exec tsc --noEmit` → expected PASS.
Run: `pnpm dev` and open `http://localhost:3000/` → expect the Qiimale header + switcher; `http://localhost:3000/en` should also render. Expected: two locales render, admin unaffected.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(frontend): localized root layout, header, language switcher"
```

---

## Task 16: Home page (search, categories, latest reviews, top-rated)

**Files:**
- Modify: `src/app/(frontend)/[locale]/page.tsx`
- Create: `src/app/(frontend)/[locale]/components/PlaceCard.tsx`, `StarRating.tsx`

**Interfaces:**
- Consumes: `getPayloadClient`, `getTranslations`, `getLocale`, `routing`.
- Produces: home page with a search box (links to `/search?q=...`), category grid (lucide icons), latest 5 reviews, top-rated places.

- [ ] **Step 1: Create `src/app/(frontend)/[locale]/components/StarRating.tsx`** (one reusable component — used across Task 16-19)

```tsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  if (onChange) {
    return (
      <div className="flex gap-1" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star size={size} className={cn(value >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={cn(value >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/(frontend)/[locale]/components/PlaceCard.tsx`**

```tsx
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { StarRating } from './StarRating';

export function PlaceCard({ place, locale }: { place: any; locale: string }) {
  const category = typeof place.category === 'object' ? place.category : null;
  const city = typeof place.city === 'object' ? place.city : null;
  const Icon = category?.icon ? (Icons as any)[category.icon] : Icons.MapPin;
  return (
    <Link href={`/place/${place.slug}`} className="block rounded-lg border p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{place.name}</div>
          <div className="text-sm text-muted-foreground">
            {category?.name?.[locale] ?? category?.name} · {city?.name?.[locale] ?? city?.name}
          </div>
        </div>
        {Icon ? <Icon size={18} className="text-muted-foreground shrink-0" /> : null}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <StarRating value={Math.round(place.ratingAvg || 0)} />
        <span className="text-muted-foreground">{place.reviewCount || 0}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Rewrite `src/app/(frontend)/[locale]/page.tsx`**

```tsx
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import * as Icons from 'lucide-react';
import { getPayloadClient } from '@/lib/get-payload';
import { PlaceCard } from './components/PlaceCard';

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: 'categories',
    limit: 50,
    locale,
    fallbackLocale: 'so',
  });
  const topPlaces = await payload.find({
    collection: 'places',
    where: { status: { equals: 'approved' } },
    limit: 6,
    sort: '-ratingAvg',
    overrideAccess: true,
    locale,
    fallbackLocale: 'so',
    depth: 1,
  });
  const latestReviews = await payload.find({
    collection: 'reviews',
    where: { status: { equals: 'published' } },
    limit: 5,
    sort: '-createdAt',
    overrideAccess: true,
    depth: 2,
  });

  return (
    <div className="space-y-10">
      <form action="/search" className="max-w-xl mx-auto">
        <input
          name="q"
          placeholder={t('Search.placeholder')}
          className="w-full rounded-lg border px-4 py-3"
          aria-label={t('Search.placeholder')}
        />
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('Nav.search')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.docs.map((cat: any) => {
            const Icon = cat.icon ? (Icons as any)[cat.icon] : Icons.Tag;
            return (
              <Link key={cat.id} href={`/search?category=${cat.slug}`} className="rounded-lg border p-4 hover:bg-muted/50">
                <Icon size={20} />
                <div className="mt-1 text-sm">{cat.name}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('Place.rating')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {topPlaces.docs.map((p: any) => <PlaceCard key={p.id} place={p} locale={locale} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t('Nav.home')}</h2>
        <ul className="space-y-2 text-sm">
          {latestReviews.docs.map((r: any) => {
            const place = typeof r.place === 'object' ? r.place : null;
            return place ? (
              <li key={r.id}>
                <Link href={`/place/${place.slug}`} className="text-blue-600 hover:underline">{place.name}</Link>
                <span className="text-muted-foreground"> — {r.rating}★ · {r.text.slice(0, 80)}…</span>
              </li>
            ) : null;
          })}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit` → expected PASS.
Run: `pnpm lint` → expected PASS (check alt text on `<input aria-label>` not flagged).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(home): search box, category grid, top-rated + latest reviews"
```

---

## Task 17: Search page

**Files:**
- Create: `src/app/(frontend)/[locale]/search/page.tsx`

- [ ] **Step 1: Create `src/app/(frontend)/[locale]/search/page.tsx`**

```tsx
import { getLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/get-payload';
import { PlaceCard } from '../components/PlaceCard';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}) {
  const t = await getTranslations('Search');
  const locale = await getLocale();
  const params = await searchParams;
  const payload = await getPayloadClient();

  const and: any[] = [{ status: { equals: 'approved' } }];
  if (params.q) and.push({ name: { contains: params.q } });
  const placeDocs = await payload.find({
    collection: 'places',
    where: { and },
    limit: 40,
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: 'so',
  });

  let filtered = placeDocs.docs;
  if (params.category) {
    filtered = (await payload.find({
      collection: 'places',
      where: { and: [{ status: { equals: 'approved' } }, { 'category.slug': { equals: params.category } }] },
      limit: 40,
      overrideAccess: true,
      depth: 1,
      locale,
      fallbackLocale: 'so',
    })).docs;
    if (params.q) filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(params.q!.toLowerCase()));
  }
  if (params.city) filtered = filtered.filter((p: any) => typeof p.city === 'object' && p.city?.slug === params.city);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('results')}</h1>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((p: any) => <PlaceCard key={p.id} place={p} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit` → expected PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(search): place search/filter by q, category, city"
```

---

## Task 18: Place detail page — review list, upvote, flag

**Files:**
- Create: `src/app/(frontend)/[locale]/place/[slug]/page.tsx`, components `ReviewCard.tsx`, `UpvoteButton.tsx`, `FlagButton.tsx`

**Interfaces:**
- Produces: place page showing header, rating breakdown bar, review list sorted by query (`?sort=recent|top|high|low`), each review card with upvote + flag buttons (client components calling `toggleUpvote` / `flagReview`). `Write a review` CTA.

- [ ] **Step 1: Create `UpvoteButton.tsx`**

```tsx
'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ThumbsUp } from 'lucide-react';
import { toggleUpvote } from '@/lib/actions/upvotes';
import { cn } from '@/lib/utils';

export function UpvoteButton({ reviewId, count, upvoted }: { reviewId: string; count: number; upvoted: boolean }) {
  const t = useTranslations('Review');
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await toggleUpvote({ reviewId }); })}
      className={cn('inline-flex items-center gap-1 text-sm', upvoted && 'text-blue-600')}
      aria-label={t('upvote')}
    >
      <ThumbsUp size={16} />
      <span>{count}</span>
    </button>
  );
}
```

- [ ] **Step 2: Create `FlagButton.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import { flagReview } from '@/lib/actions/flags';

export function FlagButton({ reviewId, flagged }: { reviewId: string; flagged: boolean }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const reasons: Array<'fake' | 'offensive' | 'spam' | 'coi' | 'other'> = ['fake', 'offensive', 'spam', 'coi', 'other'];

  if (flagged) {
    return <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Flag size={14} />{t('Review.flagged')}</span>;
  }
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-muted-foreground inline-flex items-center gap-1" aria-label={t('Review.flag')}>
        <Flag size={14} />{t('Review.flag')}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 rounded border bg-background p-2 text-xs shadow">
          {reasons.map((r) => (
            <button
              key={r}
              disabled={pending}
              onClick={() => start(async () => { await flagReview({ reviewId, reason: r }); setOpen(false); })}
              className="block w-full px-2 py-1 text-left hover:bg-muted"
            >
              {t(`Flag.${r}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `ReviewCard.tsx`**

```tsx
import { getLocale, getTranslations } from 'next-intl/server';
import { StarRating } from '../StarRating';
import { UpvoteButton } from '../UpvoteButton';
import { FlagButton } from '../FlagButton';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';

export async function ReviewCard({ review, locale }: { review: any; locale: string }) {
  const t = await getTranslations('Review');
  const payload = await getPayloadClient();
  const user = await getCurrentUser();
  const author = typeof review.author === 'object' ? review.author : null;

  let upvoted = false;
  if (user) {
    const found = await payload.find({
      collection: 'review-upvotes',
      where: { and: [{ review: { equals: review.id } }, { user: { equals: user.id } }] },
      limit: 1,
      overrideAccess: false,
      user,
    });
    upvoted = found.docs.length > 0;
  }
  let flagged = false;
  if (user) {
    const f = await payload.find({
      collection: 'flags',
      where: { and: [{ review: { equals: review.id } }, { reporter: { equals: user.id } }, { status: { equals: 'open' } }] },
      limit: 1,
      overrideAccess: false,
      user,
    });
    flagged = f.docs.length > 0;
  }

  return (
    <article className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <StarRating value={review.rating} />
        <span className="text-xs text-muted-foreground">{t('by', { name: author?.name })}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{review.text}</p>
      {review.photos?.length > 0 && (
        <div className="flex gap-2">
          {review.photos.map((p: any) => {
            const img = typeof p.image === 'object' ? p.image : null;
            const url = img?.url || img?.filename;
            if (!url) return null;
            return (
              // ponytail: lightbox deferred; clicking opens the full-size in a new tab
              <a key={p.id} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
              </a>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-4">
        <UpvoteButton reviewId={review.id} count={review.upvoteCount || 0} upvoted={upvoted} />
        {user && <FlagButton reviewId={review.id} flagged={flagged} />}
      </div>
    </article>
  );
}
```
```

- [ ] **Step 4: Create `src/app/(frontend)/[locale]/place/[slug]/page.tsx`**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/get-payload';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';

const SORTS = ['recent', 'top', 'high', 'low'] as const;
type SortKey = typeof SORTS[number];

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations('Place');
  const tReview = await getTranslations('Review');
  const locale = await getLocale();
  const sp = await searchParams;
  const sort: SortKey = (SORTS as readonly string[]).includes(sp.sort || '') ? (sp.sort as SortKey) : 'recent';

  const payload = await getPayloadClient();
  const found = await payload.find({
    collection: 'places',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale,
    fallbackLocale: 'so',
  });
  const place = found.docs[0];
  if (!place || place.status !== 'approved') notFound();

  const sortField = sort === 'recent' ? '-createdAt' : sort === 'top' ? '-upvoteCount' : sort === 'high' ? '-rating' : 'rating';
  const reviews = await payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: place.id } }, { status: { equals: 'published' } }] },
    limit: 50,
    sort: sortField,
    overrideAccess: true,
    depth: 2,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{place.name}</h1>
        <p className="text-sm text-muted-foreground">
          {place.category?.name?.[locale] ?? place.category?.name} · {place.city?.name?.[locale] ?? place.city?.name}
        </p>
        {place.address && <p className="text-sm mt-1">{`${t('address')}: ${place.address}`}</p>}
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={Math.round(place.ratingAvg || 0)} size={20} />
          <span className="text-sm text-muted-foreground">
            {place.ratingAvg?.toFixed(1) ?? '0'} · {t('reviews', { count: place.reviewCount || 0 })}
          </span>
        </div>
        <Link href={`/place/${slug}/review`} className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">
          {t('writeReview')}
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        {SORTS.map((s) => (
          <Link key={s} href={`/place/${slug}?sort=${s}`} className={sort === s ? 'font-semibold' : 'text-muted-foreground'}>
            {tReview(`sort${s[0].toUpperCase()}${s.slice(1)}` as any)}
          </Link>
        ))}
      </div>

      {reviews.docs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>{t('noReviews')}</p>
          <p className="text-sm">{t('noReviewsHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.docs.map((r: any) => <ReviewCard key={r.id} review={r} locale={locale} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint` → expected PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(place): place page with reviews, sort, upvote, flag"
```

---

## Task 19: Review form page + photo upload

**Files:**
- Create: `src/app/(frontend)/[locale]/place/[slug]/review/page.tsx`, components `ReviewForm.tsx`

**Interfaces:**
- Consumes: `submitReview`, `getPayloadClient`, `getCurrentUser`. The form posts photos first via the Payload REST `/api/media` (authenticated with the `payload-token` cookie) to obtain media IDs, then calls `submitReview`. Upload uses a hidden file input + chain of client fetches — ponytail: simple two-step.

- [ ] **Step 1: Create `ReviewForm.tsx`** (client component; uploads then submits)

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { StarRating } from '../../components/StarRating';
import { submitReview } from '@/lib/actions/reviews';
import { error, type ActionResult } from '@/lib/types';

async function uploadPhoto(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'same-origin' });
  if (!res.ok) return null;
  const doc = await res.json();
  return doc?.doc?.id ?? null;
}

export function ReviewForm({ placeId, placeSlug, existing }: { placeId: string; placeSlug: string; existing?: { rating: number; text: string } }) {
  const t = useTranslations('Review');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files || []).slice(0, 3));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || text.length < 20) { setErr(t('minLength')); return; }
    start(async () => {
      const photoIds: string[] = [];
      for (const f of files) {
        const id = await uploadPhoto(f);
        if (id) photoIds.push(id);
      }
      const res: ActionResult<{ reviewId: string }> = await submitReview({ placeId, rating, text, photoIds });
      if (!res.ok) { setErr(res.error.message); return; }
      router.push(`/place/${placeSlug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-sm font-medium">{t('rating')}</label>
        <StarRating value={rating} size={28} onChange={setRating} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="text">{t('comment')}</label>
        <textarea id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('commentPlaceholder')} className="mt-1 w-full rounded border p-2 min-h-32" />
      </div>
      <div>
        <label className="text-sm font-medium">{t('photos')}</label>
        <input type="file" accept="image/*" multiple max={3} onChange={onFiles} className="mt-1 block" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
        {t('submit')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/app/(frontend)/[locale]/place/[slug]/review/page.tsx`**

```tsx
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { ReviewForm } from '../../../components/ReviewForm';

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  const payload = await getPayloadClient();
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);
  if (!user._verified) {
    return <p className="text-muted-foreground">{t('Auth.verifyEmail')}</p>;
  }

  const place = (await payload.find({
    collection: 'places',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })).docs[0];
  if (!place || place.status !== 'approved') notFound();

  const existing = (await payload.find({
    collection: 'reviews',
    where: { and: [{ place: { equals: place.id } }, { author: { equals: user.id } }] },
    limit: 1,
    overrideAccess: false,
    user,
  })).docs[0] as any;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{existing ? t('Place.editReview') : t('Place.writeReview')}</h1>
      <ReviewForm placeId={place.id} placeSlug={place.slug} existing={existing ? { rating: existing.rating, text: existing.text } : undefined} />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint` → expected PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(reviews): review form page with star input + photo upload"
```

---

## Task 20: Add-place page

**Files:**
- Create: `src/app/(frontend)/[locale]/add-place/page.tsx`, components `AddPlaceForm.tsx`

- [ ] **Step 1: Create `AddPlaceForm.tsx`** (client; loads categories + cities via admin-readable REST? Those are public reads → `/api/categories` + `/api/cities`)

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { addPlace } from '@/lib/actions/places';

export function AddPlaceForm() {
  const t = useTranslations('AddPlace');
  const tErr = useTranslations('Errors');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cats, setCats] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/categories?limit=100').then((r) => r.json()), fetch('/api/cities?limit=100').then((r) => r.json())])
      .then(([c, ci]) => { setCats(c.docs || []); setCities(ci.docs || []); });
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    start(async () => {
      const res = await addPlace({
        name: String(fd.get('name') || ''),
        categoryId: String(fd.get('category') || ''),
        cityId: String(fd.get('city') || ''),
        address: String(fd.get('address') || ''),
        description: String(fd.get('description') || ''),
      });
      if (!res.ok) { setErr(tErr(res.error.code as any) || res.error.message); return; }
      router.push('/account');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
      <Field label={t('name')} name="name" required />
      <label className="block text-sm">{t('category')}
        <select name="category" required className="mt-1 block w-full rounded border p-2">
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">{t('city')}
        <select name="city" required className="mt-1 block w-full rounded border p-2">
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <Field label={t('address')} name="address" />
      <label className="block text-sm">{t('description')}
        <textarea name="description" className="mt-1 block w-full rounded border p-2" />
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{t('submit')}</button>
    </form>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block text-sm">{label}
      <input name={name} required={required} className="mt-1 block w-full rounded border p-2" />
    </label>
  );
}
```

- [ ] **Step 2: Create `src/app/(frontend)/[locale]/add-place/page.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AddPlaceForm } from '../../components/AddPlaceForm';

export default async function AddPlacePage() {
  const t = await getTranslations('AddPlace');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <AddPlaceForm />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit` → expected PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(place): add-place page + form action"
```

---

## Task 21: Account page (my reviews + my places)

**Files:**
- Create: `src/app/(frontend)/[locale]/account/page.tsx`

- [ ] **Step 1: Create `src/app/(frontend)/[locale]/account/page.tsx`**

```tsx
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/get-payload';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const t = await getTranslations('Account');
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const payload = await getPayloadClient();

  const reviews = await payload.find({
    collection: 'reviews',
    where: { author: { equals: user.id } },
    overrideAccess: false,
    user,
    depth: 1,
  });
  const places = await payload.find({
    collection: 'places',
    where: { submittedBy: { equals: user.id } },
    overrideAccess: false,
    user,
    depth: 1,
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold mb-3">{t('myReviews')}</h1>
        <ul className="space-y-1 text-sm">
          {reviews.docs.length === 0 && <li className="text-muted-foreground">—</li>}
          {reviews.docs.map((r: any) => {
            const place = typeof r.place === 'object' ? r.place : null;
            return place ? (
              <li key={r.id}>
                <Link href={`/place/${place.slug}`} className="text-blue-600 hover:underline">{place.name}</Link>
                <span className="text-muted-foreground"> — {r.rating}★</span>
              </li>
            ) : null;
          })}
        </ul>
      </section>

      <section>
        <h1 className="text-xl font-semibold mb-3">{t('myPlaces')}</h1>
        <ul className="space-y-1 text-sm">
          {places.docs.length === 0 && <li className="text-muted-foreground">—</li>}
          {places.docs.map((p: any) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className={p.status === 'pending' ? 'text-amber-600' : 'text-green-600'}>
                {p.status === 'pending' ? t('statusPending') : t('statusApproved')}
              </span>
              {p.status === 'approved' && (
                <Link href={`/place/${p.slug}`} className="text-blue-600 hover:underline">{p.name}</Link>
              )}
              {p.status !== 'approved' && <span>{p.name}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit` → expected PASS.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(account): list user reviews and submitted places"
```

---

## Task 22: Auth pages (login, register, verify) + logout

**Files:**
- Create: `src/app/(frontend)/[locale]/login/page.tsx`, `register/page.tsx`, `verify/page.tsx`

- [ ] **Step 1: Create `LoginForm.tsx`** at `src/app/(frontend)/[locale]/components/LoginForm.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { loginUser } from '@/lib/actions/auth';
import { logoutUser } from '@/lib/actions/auth';

export function LoginForm({ existingUser }: { existingUser?: boolean }) {
  const t = useTranslations('Auth');
  const tErr = useTranslations('Errors');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogout() { await logoutUser(); router.refresh(); }
  if (existingUser) {
    return <button onClick={onLogout} className="text-sm underline">logout</button>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const res = await loginUser({ email: String(fd.get('email')), password: String(fd.get('password')) });
    setPending(false);
    if (!res.ok) { setErr(tErr(res.error.code as any) || res.error.message); return; }
    router.push('/account');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <h1 className="text-xl font-semibold">{t('login')}</h1>
      <input name="email" type="email" placeholder={t('email')} required className="w-full rounded border p-2" />
      <input name="password" type="password" placeholder={t('password')} required className="w-full rounded border p-2" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground">{t('login')}</button>
      <a href="/api/auth/google" className="block w-full rounded-md border px-4 py-2 text-center text-sm">{t('google')}</a>
      <p className="text-sm"><a href="/register" className="text-blue-600 underline">{t('noAccount')}</a></p>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/app/(frontend)/[locale]/login/page.tsx`**

```tsx
import { LoginForm } from '../../components/LoginForm';
export default async function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 3: Create `RegisterForm.tsx` + `register/page.tsx`** (mirrors LoginForm; calls `registerUser`)

`src/app/(frontend)/[locale]/components/RegisterForm.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { registerUser } from '@/lib/actions/auth';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const tErr = useTranslations('Errors');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    setPending(true);
    const res = await registerUser({ name: String(fd.get('name')), email: String(fd.get('email')), password: String(fd.get('password')) });
    setPending(false);
    if (!res.ok) { setErr(tErr(res.error.code as any) || res.error.message); return; }
    setMsg(t('emailSent'));
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <h1 className="text-xl font-semibold">{t('register')}</h1>
      <input name="name" placeholder={t('name')} required className="w-full rounded border p-2" />
      <input name="email" type="email" placeholder={t('email')} required className="w-full rounded border p-2" />
      <input name="password" type="password" placeholder={t('password')} required className="w-full rounded border p-2" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{t('register')}</button>
      <a href="/api/auth/google" className="block w-full rounded-md border px-4 py-2 text-center text-sm">{t('google')}</a>
      <p className="text-sm"><a href="/login" className="text-blue-600 underline">{t('haveAccount')}</a></p>
    </form>
  );
}
```

`src/app/(frontend)/[locale]/register/page.tsx`:

```tsx
import { RegisterForm } from '../../components/RegisterForm';
export default async function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 4: Create `src/app/(frontend)/[locale]/verify/page.tsx`** (reads `?token=`, calls `verifyEmail`)

```tsx
import { getTranslations } from 'next-intl/server';
import { verifyEmail } from '@/lib/actions/auth';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const t = await getTranslations('Auth');
  const { token } = await searchParams;
  if (!token) return <p>{t('verifyFail')}</p>;
  const res = await verifyEmail(String(token));
  return <p className={res.ok ? 'text-green-600' : 'text-red-600'}>{res.ok ? t('verifySuccess') : t('verifyFail')}</p>;
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint` → expected PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(auth): login/register/verify pages + logout"
```

---

## Task 23: PWA manifest + icons, native review flag

**Files:**
- Create: `src/app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Note: use placeholder icons; replace with branded art later.

**Interfaces:**
- Produces: `app/manifest.ts` exporting a `MetadataRoute.Manifest` object. Icons live under `/icons/`.

> AGENTS.md (Next 16): verify the manifest route name in `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md` before saving — manifest convention is `app/manifest.ts`. (Task 15's layout already references `/manifest.webmanifest`; the manifest route serves at `/manifest.webmanifest` by default.)

- [ ] **Step 1: Generate placeholder icons**

```bash
mkdir -p public/icons
pnpm exec node -e "const sharp=require('sharp'); Promise.all([sharp({create:{width:192,height:192,background:'#0ea5e9',channels:4}}).png().toFile('public/icons/icon-192.png'), sharp({create:{width:512,height:512,background:'#0ea5e9',channels:4}}).png().toFile('public/icons/icon-512.png')])"
```

> If `sharp` CLI quoting is awkward, instead write a 10-line script `scripts/gen-icons.mjs`. Skip redundant icon generated if the same icons exist.

- [ ] **Step 2: Create `src/app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Qiimale',
    short_name: 'Qiimale',
    description: 'Qiimayn goobo & adeegyo Soomaaliya',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`, open `http://localhost:3000/manifest.webmanifest` → expect the JSON manifest.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(pwa): web manifest + placeholder icons"
```

---

## Task 24: Full smoke test + native-speaker copy review

**Files:** none (manual)

- [ ] **Step 1: End-to-end smoke**

Run: `pnpm dev` + `pnpm test` + `pnpm lint`.

Manual flow (a reviewer runs this in the browser):
1. Register with an address you can click → click the verification email link → lands on `/verify` showing success.
2. Log in; go to `/add-place`; submit "Test Cafe" in category restaurants, city Mogadishu. See it in `/account` as Pending.
3. In `/admin`, approve the place; back in `/account` it shows Approved with a link.
4. On `/place/test-cafe`, click "Write a review"; rate 4 stars, type 20+ chars, upload 1 photo; submit. Review appears, average = 4.0, count = 1.
5. Register a second user in another browser/incognito; rate 5 stars on the same place. Average = 4.5, count = 2. (Validates the stats hook end-to-end — the spec's most-critical path.)
6. Upvote the first review from the second user; upvote count increments. Try to upvote own review from user #1 → "you can't upvote your own review".
7. Flag the review from user #2 with reason "fake". The review flagCount increments.
8. In `/admin`, set the review's `status: hidden`. Back on `/place/test-cafe` it disappears, and the place's average/count recompute to only publishable reviews.
9. Switch language to English via the header switcher; all UI strings render in English; switch back. So/`/en/...` URLs both work.
10. Trigger the PWA install prompt in Chrome mobile view; manifest loads.

Expected: each step behaves as described. If a stats number drifts, the stats hook (Task 8) or `computeStats` (Task 2) is the suspect.

- [ ] **Step 2: Native-speaker copy review** (per Task 1 constraint)

Hand `messages/so.json` to a native Somali speaker. Replace any unclear or wrong strings before launch.

- [ ] **Step 3: Final commit (if any copy edits)**

```bash
git add -A && git commit -m "i18n: Somali copy review pass"
```

---

## Notes & limitations (read before execution)

- **`overrideAccess` discipline:** public-facing Local API reads use `overrideAccess: true` for *place cards / lists* (we already filter by `status: approved` in `where`) only where required, and `overrideAccess: false` + `user` for actions that must respect user permissions (reviews create/update, upvotes, flags). Double-check each action.
- **Stats hook loop guard:** `resync` checks `req.context.skipStats`; the place update sets `context: { skipStats: true }`. The upvote hook uses a separate `skipUpvoteStats` flag and also sets `skipStats: true` on its `reviews.update` to avoid triggering `recomputeOnReviewChange`.
- **Mongo transactions:** Atlas free tier is a replica set → `req` threading makes hook writes atomic. Local single-node Mongo (no replica set) degrades non-atomically but recomputes are idempotent, so the next write self-heals.
- **Google OAuth fallback:** if `getFieldsToSign`/`jwtSign` APIs differ in the installed Payload, fall back to POSTing to `/api/users/login`? No — we set a random password. Alternative: have OAuth-only users call a custom endpoint that uses Payload's `forgotPassword` to set a known ephemeral password then login. Simpler: keep `jwtSign` + `getFieldsToSign` (both verified exported in Task 14 in `payload/dist/index.d.ts`).
- **Defamation/legal:** before public launch, add a takedown policy page and a contact route; the admin flag queue is the v1 mitigation per spec.
- **Ponytail:** photo lightbox deferred (a `<a target="_blank">` opens the full image); `Cities`/`Categories` edits done in admin panel (no UI file); no automated fake-review AI; no offline service worker. Add each only if / when needed.