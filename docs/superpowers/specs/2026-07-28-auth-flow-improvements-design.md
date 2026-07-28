# Auth Flow Improvements Design

## Overview

Fix and improve the authentication flow in Qiimale. Five problems identified:

1. **Google OAuth login doesn't stick** — cookie not surviving the redirect
2. **Registration dead-end** — "email sent" message with no next steps
3. **Duplicate email error** — generic "aan sax ahayn" instead of helpful message
4. **Unverified user gating** — allow login but block write operations
5. **Forgot password** — no UI for existing Payload endpoints

## 1. Google OAuth — Session Bridge

**Root cause:** Setting a cookie on a `NextResponse.redirect()` in a route handler is unreliable — the browser follows the redirect before the Set-Cookie header is applied.

**New flow:**
```
/api/auth/google → Google consent screen
/api/auth/google/callback → exchanges code, creates/finds user, redirects to:
/auth/callback?token=<jwt>&next=/
```

**New file: `src/app/auth/callback/page.tsx`**
- Minimal server component, no locale needed
- Reads `token` and `next` from search params
- Calls `setSessionFromToken(token)` server action
- Redirects to `next` or `/`

**Changes:**
- `src/app/api/auth/google/callback/route.ts`: Remove cookie setting, redirect to `/auth/callback?token=...`
- `src/lib/actions/auth.ts`: Add `setSessionFromToken(token)` server action that sets the cookie via `cookies().set()`
- `src/lib/types.ts`: No changes needed — `setSessionCookie` already works

## 2. Registration Flow & Verify Page

**After registration:**
- `registerUser` action returns success
- Frontend redirects to `/[locale]/verify-email?email=<encoded_email>`

**New page: `src/app/(frontend)/[locale]/verify-email/page.tsx`**
- Envelope icon + "We sent a verification link to <email>"
- Resend button with 60s cooldown (calls `resendVerificationEmail` action)
- "Check spam folder" hint
- Link to login page

**Resend verification:**
- New server action `resendVerificationEmail(email)` in `lib/actions/auth.ts`
- Calls `payload.forgotPassword({ collection: 'users', email })` which triggers Payload's built-in verification email
- Cooldown managed client-side in the verify-email component

**RegisterForm changes:**
- On success, redirect to `/verify-email?email=...` instead of showing inline message

**Verify page (`/[locale]/verify`):**
- Already works correctly (confirmed by user)
- No changes needed to the verify page itself

## 3. Error Messages & Duplicate Email

**`registerUser` action — pre-check:**
- Before `payload.create`, do `payload.find({ collection: 'users', where: { email: { equals: email } })`
- If user exists → return `{ ok: false, error: { code: "CONFLICT", message: t("auth.emailAlreadyRegistered") } }`
- If creation fails with other errors → return the actual Payload error message

**`loginUser` action — custom endpoint:**
- Since Payload's `verify: true` blocks unverified logins, we use a custom login endpoint `/api/auth/login`
- The `loginUser` server action calls this custom endpoint instead of `payload.login()`
- Custom endpoint manually verifies password, then signs JWT and returns token + user
- Response includes `{ verified: boolean }` so frontend can show banner
- If user exists but unverified, include specific message: "Please verify your email first"

**All error messages via next-intl:**
- Add keys to both `so` and `en` locale files:
  - `auth.emailAlreadyRegistered`
  - `auth.invalidCredentials`
  - `auth.unverifiedWarning`
  - `auth.verifyEmailSent`
  - `auth.verifyEmailHint`
  - `auth.resendSuccess`
  - `auth.forgotPasswordSent`
  - `auth.resetPasswordSuccess`

## 4. Unverified User Gating

**Payload config change:**
- **Keep `verify: true`** in Users collection — this ensures verification emails are sent automatically on registration AND we can use `payload.forgotPassword()` to resend
- To allow unverified users to log in despite `verify: true`, use a **custom login endpoint** (`/api/auth/login`) that calls `payload.login()` with `disableEmailVerification: true` or bypasses the check
- Alternative: use a `beforeLogin` hook that skips verification check but still sends the email on create

**Access control on write operations:**
- `Places` collection: `create` access → `verifiedOnly` (already exists)
- `Reviews` collection: `create` access → `verifiedOnly`
- `ReviewUpvotes` collection: `create` access → `verifiedOnly`
- All `read` access stays public

**Frontend banner:**
- In the app layout or account page, check `_verified`
- Show persistent banner for unverified users: "Please verify your email to unlock all features"
- Banner includes resend button (reuses `resendVerificationEmail` action)

**Account page:**
- Show verification status with color badge
- Resend verification button for unverified users

## 5. Forgot Password

**New page: `src/app/(frontend)/[locale]/forgot-password/page.tsx`**
- Email input form
- Calls `POST /api/users/forgot-password` (Payload built-in)
- Shows success: "Check your email for a reset link"
- Link back to login

**New page: `src/app/(frontend)/[locale]/reset-password/page.tsx`**
- Reads `token` from search params
- Password + confirm password fields
- Calls `POST /api/users/reset-password` (Payload built-in)
- On success, redirect to `/login?reset=true`

**Login page changes:**
- Add "Forgot password?" link below the login form
- Handle `?verified=true` param to show "Email verified successfully" success message
- Handle `?reset=true` param to show "Password reset successfully" success message

## Files to Create

| File | Purpose |
|---|---|
| `src/app/auth/callback/page.tsx` | OAuth session bridge |
| `src/app/(frontend)/[locale]/verify-email/page.tsx` | Post-registration verify prompt |
| `src/app/(frontend)/[locale]/forgot-password/page.tsx` | Forgot password form |
| `src/app/(frontend)/[locale]/reset-password/page.tsx` | Reset password form |
| `src/app/api/auth/login/route.ts` | Custom login endpoint that bypasses verification check |

## Files to Modify

| File | Change |
|---|---|
| `src/collections/Users.ts` | Keep `verify: true` config (email templates + login blocking), custom login bypasses the block |
| `src/lib/actions/auth.ts` | Add `setSessionFromToken`, `resendVerificationEmail`; fix `registerUser` duplicate check; add `verified` flag to `loginUser` response |
| `src/app/api/auth/google/callback/route.ts` | Redirect to `/auth/callback` instead of setting cookie |
| `src/app/(frontend)/[locale]/components/RegisterForm.tsx` | Redirect to verify-email page on success |
| `src/app/(frontend)/[locale]/components/LoginForm.tsx` | Add forgot-password link, show unverified banner |
| `src/app/(frontend)/[locale]/login/page.tsx` | Handle `?verified=true` and `?reset=true` params |
| `src/app/(frontend)/[locale]/account/page.tsx` | Add verification status + resend button |
| `src/collections/Places.ts` | Add `verifiedOnly` to `create` access |
| `src/collections/Reviews.ts` | Add `verifiedOnly` to `create` access |
| `src/collections/ReviewUpvotes.ts` | Add `verifiedOnly` to `create` access |
| `src/messages/so.json` | Add auth translation keys |
| `src/messages/en.json` | Add auth translation keys |

## Out of Scope

- Password strength requirements (min 8 already enforced)
- Rate limiting on auth endpoints (Payload has `maxLoginAttempts`)
- Session refresh / token renewal
- Email template redesign (existing Somali templates are fine)
