# Qiimale MVP — Design Spec

**Date:** 2026-07-24
**Status:** Approved (pending written-spec review)

## Background

Qiimale is a Trustpilot-like public review platform for Somalia, proposed by Sharafdin Yusuf. People should be able to check reviews for restaurants, universities, companies, educational centers, hospitals, and other services before using them. Every review features a 1–5 star rating, a detailed comment, optional photo evidence, and upvotes. Honest reviews build trust and push service providers to improve.

The repo is a fresh Next.js 16.2 + Payload CMS 3.85 + MongoDB + Tailwind v4 + shadcn boilerplate (`nextjs-payload-template`), single initial commit. **Note: this Next.js version has breaking changes vs. common training data — implementation must consult `node_modules/next/dist/docs/` before writing code** (per repo `AGENTS.md`).

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Platform | Responsive web app + PWA install prompt. No native apps in v1. |
| Languages | Somali (default) + English, via **next-intl**. |
| Listing source | Anyone can add a place; admin approves before it goes live. |
| Auth | Email/password (Payload built-in, email verification required) + Google OAuth (custom route handlers). |
| Moderation | Reviews publish instantly; flagging + admin queue. |
| Business side | Reviewer-side only. No claiming/replies in v1. |
| Architecture | Payload-native: collections + Local API reads in server components, server actions for mutations, Payload admin = moderation dashboard. |

## Goals / Non-goals

**Goals**
- Browse/search places by name, category, city.
- Read reviews with stars, text, photos, upvotes.
- Verified-registered users can add places, write one review per place, upvote, flag.
- Admins moderate entirely from the Payload admin panel.
- Installable PWA, mobile-first, Somali-first.

**Non-goals (v1)** — business claiming/replies, native mobile apps, offline mode, automated fake-review detection, monetization, notifications.

## Architecture

Monolith: Next.js App Router serves both the frontend (`app/(frontend)/[locale]/`) and Payload (`app/(payload)/`, admin at `/admin`, REST at `/api`). MongoDB via `@payloadcms/db-mongodb`. Frontend reads use Payload **Local API** in server components. Writes go through Next **server actions** that call the Local API. Payload admin panel is the moderation dashboard — no custom admin UI.

### Libraries

- **next-intl** (new dependency) — locales `['so', 'en']`, `defaultLocale: 'so'`, `localePrefix: 'as-needed'` → Somali URLs unprefixed (`/place/x`), English at `/en/place/x`. Setup per current docs: `defineRouting` in `src/i18n/routing.ts`, `getRequestConfig` in `src/i18n/request.ts`, `createNextIntlPlugin()` wrapping `next.config.ts` (composed with `withPayload`), next-intl middleware with a matcher that **excludes `/admin`, `/api`, and Payload asset paths** so Payload routing is untouched. Messages in `messages/so.json` + `messages/en.json`. `NextIntlClientProvider` in the `[locale]` layout.
- **@payloadcms/storage-r2** (new dependency, production only) — `r2Storage({ collections: { media: true }, bucket, config: { credentials, region: 'auto', endpoint } })`. Requires an R2 public URL (r2.dev subdomain or custom domain); Payload's file proxy is bypassed accordingly. Dev uses local disk storage. Registered in the `plugins` array (v3 style; v4 moves this to a top-level `storage` key — noted for future upgrades).
- Existing: zod (validation), shadcn/radix (UI), lucide-react (icons), tailwind.

## Data model (Payload collections)

Payload conventions per current docs: native `slug` field type (`useAsSlug`) for slugs; no `versions.drafts` on these collections (moderation lifecycle ≠ editorial drafts), so explicit `status` select fields are intentional, not redundant. Types come from `payload-types.ts` (auto-generated in dev / on `payload build`).

### `users` (extends existing)
- `role`: select `admin | reviewer`, default `reviewer`, `saveToJWT: true` (avoid DB lookups in access checks).
- `displayName`: text, required.
- Auth config: `auth: { verify: true }` → Payload's built-in email verification. **Only verified users can publish reviews** (checked in access control + server actions).

### `categories`
- `name`: text, required, `localized: true` (Somali + English).
- `slug`: native slug, `useAsSlug: 'name'` (slug generated from the default-locale name).
- `icon`: text (lucide icon name, e.g. `utensils`, `graduation-cap`).
- Seeded: restaurants, universities, hospitals, companies, educational centers, hotels, government services, shops, other. Admin-managed afterwards.

### `cities`
- `name`: text, required, `localized: true`.
- `slug`: native slug.
- Seeded: Mogadishu, Hargeisa, Garowe, Kismayo, Baidoa, Berbera, Bosaso, Galkayo, Dhusamareb, Jowhar. Admin-managed afterwards.

Payload `localization` config: `locales: ['so', 'en']`, `defaultLocale: 'so'` (drives the `localized` fields above; frontend passes `locale` in Local API queries).

### `places`
- `name`: text, required. `slug`: native slug, `useAsSlug: 'name'`, unique (append suffix on collision — handled in `beforeChange` if needed).
- `category`: relationship → `categories`, required. `city`: relationship → `cities`, required.
- `address`: text, optional. `description`: textarea, optional.
- `status`: select `pending | approved | rejected`, default `pending`, index. Sidebar position.
- `submittedBy`: relationship → `users`, set server-side from `req.user`, admin read-only.
- `ratingAvg`: number, default 0, admin read-only. `reviewCount`: number, default 0, admin read-only. Both maintained by hooks on `reviews`, both indexed (sorting/filtering).

### `reviews`
- `place`: relationship → `places`, required, index.
- `author`: relationship → `users`, required, set server-side, index.
- `rating`: number, required, min 1, max 5.
- `text`: textarea, required, min 20 chars (enforced in the action).
- `photos`: array of upload → `media`, `maxRows: 3`.
- `status`: select `published | hidden | removed`, default `published`, index.
- `upvoteCount`: number, default 0, admin read-only. `flagCount`: number, default 0, index (queue sorting).
- **Invariant: one review per (place, author).** Enforced in the server action (lookup-then-create/update, `overrideAccess: false` path not used here — action runs as system but validates the rule itself) and backed by a compound DB index where the adapter allows.

### `review-upvotes`
- `review`: relationship → `reviews`, required, index.
- `user`: relationship → `users`, required, index.
- Invariant: one row per (review, user) — enforced in `toggleUpvote` action.

### `flags`
- `review`: relationship → `reviews`, required, index.
- `reporter`: relationship → `users`, required, set server-side.
- `reason`: select `fake | offensive | spam | conflict-of-interest | other`, required.
- `note`: text, optional.
- `status`: select `open | resolved`, default `open`.
- Admin default view filtered to `open`, sorted by `review.flagCount` desc (the moderation queue).

### `media`
- Payload upload collection: `imageSizes` (thumbnail 400px, card 800px), output `webp`, `mimeTypes: ['image/*']`, max 5MB enforced server-side.
- `alt`: text, optional.

## Access control (collection-level, via `access/` helpers)

| Collection | create | read | update | delete |
|---|---|---|---|---|
| users | anyone (register) | own doc (+ admin) | own doc (+ admin); `role` admin-only | admin |
| categories, cities | admin | anyone | admin | admin |
| places | logged-in user | `status: approved` for public; admins all; submitter sees own | admin | admin |
| reviews | logged-in **and verified** user (author = self) | `status: published` for public; admins all; author sees own | author (rating/text/photos only, while published) + admin | author + admin |
| review-upvotes | logged-in user | anyone | — | own row only (via action) |
| flags | logged-in user | admin | admin | admin |
| media | logged-in user | anyone | own (+ admin) | admin |

Security rules from current Payload docs, applied everywhere:
- Local API calls operating on behalf of a user pass `user` **and** `overrideAccess: false`. System-level calls (stats hooks) may override access deliberately.
- Nested operations inside hooks always pass `req` through (transaction atomicity).
- Hooks that write back to the DB use a `req.context` flag (e.g. `context.skipStatsHook`) to prevent infinite loops.

## Flows & mutations (server actions, zod-validated, all in `src/lib/actions/`)

Every action returns `{ ok: true, data } | { ok: false, error: { code, message } }` with translated messages surfaced in forms.

**`submitReview({ placeId, rating, text, photos })`**
1. Auth: logged in + email verified, else `UNAUTHENTICATED` / `UNVERIFIED`.
2. Place must exist and be `approved`.
3. Existing review by this user for this place? → update it (edit semantics; UI shows the form pre-filled as "edit your review").
4. Else create with `status: published`, `author: req.user`.
5. `revalidatePath` for the place page.

**`toggleUpvote({ reviewId })`**
1. Auth: logged in. Reject if review author = current user (`SELF_UPVOTE`).
2. Existing (review, user) row? → delete row, decrement `upvoteCount`. Else → create row, increment.
3. Idempotent under retries (toggle is the whole contract).

**`flagReview({ reviewId, reason, note? })`**
1. Auth: logged in. One open flag per (review, reporter) — second call returns `ALREADY_FLAGGED`.
2. Create flag, increment `review.flagCount`.

**`addPlace({ name, category, city, address?, description? })`**
1. Auth: logged in.
2. Create `status: pending`, `submittedBy: req.user`. UI tells the user it awaits admin approval.

**Place stats hook (the trust-critical piece)**
- `afterChange` + `afterDelete` on `reviews`: recompute `ratingAvg` (mean of ratings) and `reviewCount` over reviews where `status: published` for that place; write to `places` with `req` threaded and a context flag. Runs on create, edit, hide/unhide, remove — so admin moderation actions automatically correct public stats.
- Same pattern maintains `review.upvoteCount` from `review-upvotes` create/delete.

**Auth flows**
- Register/login/logout: Payload Local API (`payload.create`, `payload.login`) in server actions; verification email via Payload's built-in `verify` flow (email adapter configured via env; in dev, log the link).
- **Google OAuth (riskiest integration piece, verify against Next 16 + Payload 3.85 docs during implementation):**
  1. `GET /api/auth/google` → redirect to Google consent (Authorization Code flow, env `GOOGLE_CLIENT_ID/SECRET`, callback URL).
  2. `GET /api/auth/google/callback` → exchange code, verify ID token, take `email` + `name`.
  3. Find user by email, or create with `role: reviewer`, verified, random unguessable password.
  4. Issue Payload session: sign a JWT with `PAYLOAD_SECRET` in Payload's expected token shape and set the `payload-token` httpOnly cookie (exact mechanism confirmed against installed Payload source at implementation time).
  5. Redirect to the localized home page.

## Frontend

Routes under `app/(frontend)/[locale]/` (next-intl `[locale]` segment, `as-needed` prefix):

- `/` — search bar, category grid (icons), latest-reviews feed, top-rated places.
- `/search?q=&category=&city=` — filterable place cards (name, category, city, avg stars, review count).
- `/place/[slug]` — header (name, category, city, avg rating, count), rating-breakdown bar, review list with sort (recent / most upvoted / highest / lowest). Review card: stars, text, photos (dialog lightbox), upvote button (count), flag button, date, author display name.
- `/place/[slug]/review` — review form: star picker, textarea, photo upload ≤3. Requires verified login; pre-fills as edit if a review exists.
- `/add-place` — place form; pending notice after submit.
- `/login`, `/register`, `/verify` — email/password + "Continue with Google".
- `/account` — my reviews (edit/delete; deletion triggers the stats hook), my submitted places with status.

UI: shadcn components (card, button, dialog, select, form), one reusable `StarRating` component (display + input modes), mobile-first Tailwind. Language switcher in header linking the current path in the other locale. `generateStaticParams`/`setRequestLocale` per current next-intl static-rendering guidance — final API verified during implementation.

## PWA

- `app/manifest.ts` (Next metadata-route convention — verify path/name in Next 16 docs): name "Qiimale", short_name, icons (192/512), `display: standalone`, theme/background colors, `start_url: '/'`.
- Icons as static assets under `app/` or `public/`.
- No offline service worker in v1 (a review site offline has no value; add only if requested).

## Error handling

- All server actions: zod parse first; typed error codes (`UNAUTHENTICATED`, `UNVERIFIED`, `NOT_FOUND`, `FORBIDDEN`, `ALREADY_FLAGGED`, `SELF_UPVOTE`, `VALIDATION`); UI maps codes to translated strings.
- Upload constraints (≤3 photos, ≤5MB, image mime) enforced server-side in the action/collection config, not just in the browser.
- Payload's built-in auth rate limiting stays enabled.
- MongoDB transactions: threaded `req` keeps hook writes atomic where a replica set exists (Atlas free tier qualifies); local dev without replica set degrades gracefully (stats hooks are idempotent recomputes, so a failed transaction self-heals on the next write).

## Anti-abuse (v1)

Verified-email gate on publishing; one review per user per place; no self-upvotes; one upvote per user per review (toggle); one open flag per user per review; photo caps; admin flag queue. No automated fake-detection — revisit with real abuse data.

## Testing

Vitest (new dev dependency), four units — only paths where wrong = broken trust:
1. Stats hook: `ratingAvg`/`reviewCount` correct after create, edit, hide, unhide, delete.
2. `submitReview` enforces one-review-per-user-per-place (second call edits, doesn't duplicate).
3. `toggleUpvote` idempotent; self-upvote rejected.
4. Unverified user cannot publish.

Plus one manual smoke script: register → verify → add place → admin approve → review → upvote → flag → admin hide review → stats drop.

## Deployment

Single Next.js deploy (Vercel-style), MongoDB Atlas (free tier = replica set → transactions work), Cloudflare R2 for media. Env vars: `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, SMTP credentials for verification email.

## Risks / open questions

1. **Google OAuth session issuance** — exact JWT/cookie mechanism must be confirmed against Payload 3.85 source during implementation; fallback is a custom Payload auth strategy.
2. **next-intl middleware vs Payload** — matcher must exclude `/admin` + `/api`; verified during setup.
3. **Next 16 breaking changes** — repo `AGENTS.md` mandates reading `node_modules/next/dist/docs/` before implementation (server actions, manifest conventions, revalidation APIs).
4. **Defamation/legal exposure** is real in this market; moderation queue + hidden-review state is the v1 mitigation. Consider a takedown policy page before launch.
