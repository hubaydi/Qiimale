# Inline Review Form on Place Page

Date: 2026-08-12

## Problem

Writing a review currently requires navigating to a separate page
(`/places/[slug]/review`). The `Write a review` button on the place page links
to that route. This is a bad UX — the review form should live directly on the
place page where the user is already looking at the place.

## Design

### Placement

Render the existing `ReviewForm` (rating, comment, up to 3 photos) in a
"Write a review" section on the place page, placed as a full-width section
between the main info card and the reviews grid (i.e. above the rating
breakdown + reviews list).

The old `Write a review` `<Link>` button in the main info card is removed —
the form is now always visible on the page, so the button is a dead link.

### Login flow

The `ReviewForm` is a client component. `submitReview` server action already
returns `UNAUTHENTICATED` when the user is not logged in. On that error code
the form redirects to `/login?redirect=/places/{slug}` instead of showing an
inline error.

- `LoginPage` (`src/app/(frontend)/[locale]/login/page.tsx`) accepts a
  `redirect` search param, validates it is a local path (starts with `/` and
  not `//` — prevents open redirect), and passes it to `LoginForm`.
- `LoginForm` pushes to the redirect path after successful login instead of
  `/account`. If no redirect param is present, it keeps pushing to `/account`.
- The place page's redirect-back path includes the locale prefix
  (`/{locale}/places/{slug}`).

Unverified users still get the inline `UNVERIFIED` error from the action, as
today. The `redirect("/")` guard in `LoginPage` for already-logged-in users
honors the `redirect` param too (a logged-in user hitting `/login?redirect=...`
should land on the redirect target, not `/`).

### Draft preservation

Typing a review and hitting submit sends the user to login. When they return,
the form must still contain what they wrote — otherwise it's a bad UX.

- Before redirecting to login on `UNAUTHENTICATED`, stash `{ rating, text }` in
  `sessionStorage` under a key scoped to the place, e.g.
  `qiimale:review-draft:{placeId}`.
- On form mount, if a draft exists for this place, restore it into the form and
  remove it (one-shot — a fresh visit starts empty).
- On successful submit, clear any draft for this place.

Limit (accepted): photo files cannot be serialized to `sessionStorage`, so
chosen photos are lost on the login trip. Text and rating survive. Persisting
images would require base64-encoding files — not worth the weight.

### Edit mode

The place page is a server component and already fetches the current user.
When logged in, it looks up the user's existing review for this place and
passes `existing={ { rating, text } }` to the form, pre-filling it as an
edit — same behavior the review page has today. `submitReview` already
updates in place when a review exists, so the action is unchanged.

### Cleanup

Delete the separate review route:
`src/app/(frontend)/[locale]/places/[slug]/review/page.tsx` and its folder.
The server action's `revalidatePath("/places/{slug}")` already re-renders the
place page, so a fresh submit reflects immediately.

## Files touched

- `src/app/(frontend)/[locale]/places/[slug]/page.tsx` — fetch existing
  review, render `ReviewForm` section, remove old button.
- `src/components/ReviewForm.tsx` — draft save/restore, redirect to login on
  `UNAUTHENTICATED`.
- `src/app/(frontend)/[locale]/login/page.tsx` — accept and validate
  `redirect` param.
- `src/components/LoginForm.tsx` — push to redirect target after login.
- Delete `src/app/(frontend)/[locale]/places/[slug]/review/`.

## Out of scope

- Photo persistence across login.
- Any changes to `submitReview` or `ReviewForm` fields.
