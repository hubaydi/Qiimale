# Auth Flow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix Google OAuth cookie, improve registration UX, add forgot password, gate unverified users.

**Architecture:** Keep Payload `verify: true` (auto-emails on register, verify endpoint works). For login, use REST API via fetch instead of `payload.login()` to detect unverified errors and manually sign JWTs. OAuth uses a session bridge page to set cookies reliably.

**Tech Stack:** Next.js 15, Payload CMS 3, Resend, next-intl, MongoDB

## Global Constraints

- Keep `auth.verify: true` in Users collection — don't remove it
- All new user-facing strings go in both `so.json` and `en.json`
- Use `jwtSign` + `getFieldsToSign` from `payload` for manual JWT signing (same pattern as existing Google callback)
- SESSION_COOKIE constant: `"payload-token"`

---

### Task 1: Add translation keys

**Files:**
- Modify: `messages/so.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: Translation keys consumed by all UI tasks

- [ ] Add keys to `Auth` section in `messages/so.json`:
```json
"verifyEmailTitle": "Xaqiiji iimaylkaaga",
"verifyEmailHint": "Waxaan kuu soo dirnay xiriiriye xaqiijin ah {email}. Hubi sanduuqa iimaylkaaga.",
"resendVerification": "Dib u soo dir",
"resendSuccess": "Waxaan dib u soo dirnay iimaylka xaqiijinta.",
"resendCooldown": "Dib u soo dir ({seconds}s)",
"checkSpam": "Haddii aadan helin, hubi spam-ka.",
"forgotPassword": "Erey sirkaa waa la illaaway?",
"forgotPasswordTitle": "Soo celi ereyga sirta ah",
"forgotPasswordSent": "Haddii akoonkaagu uu jiro, waxaanu kuu soo dirnay erey sir cusub.",
"resetPassword": "Samee erey sir cusub",
"resetPasswordSuccess": "Ereyga sirta ah waa la cusboonaysiiyay. Hadda soo gal.",
"resetPasswordError": "Ereyga sirta ah ayaa fashilmay ama wuu dhacay.",
"verifiedSuccess": "Iimaylkaaga waa la xaqiijiyay! Hadda soo gal.",
"passwordResetSuccess": "Ereyga sirta ah waa la beddelay! Hadda soo gal.",
"notVerifiedWarning": "Fadlan xaqiiji iimaylkaaga si aad u qortid qiimayn."
```
- [ ] Add same keys (English) to `messages/en.json`

---

### Task 2: Update server actions

**Files:**
- Modify: `src/lib/actions/auth.ts`
- Modify: `src/lib/types.ts`

**Interfaces:**
- Consumes: `getFieldsToSign`, `jwtSign` from `payload`
- Produces: `loginUser` (now handles unverified), `registerUser` (now pre-checks duplicates + auto-logins unverified), `setSessionFromToken(token)`, `resendVerificationEmail(email)`

- [ ] In `registerUser`, replace the `payload.create()` catch block with a pre-check:
```ts
const existing = await payload.find({
  collection: "users",
  where: { email: { equals: parsed.data.email } },
  limit: 1,
  overrideAccess: true,
});
if (existing.docs.length) {
  return { ok: false, error: { code: "CONFLICT" as const, message: "Email already registered." } };
}
```
- [ ] After `payload.create()` succeeds in `registerUser`, manually sign JWT and set cookie (instead of calling `payload.login()` which would fail for unverified):
```ts
const user = await payload.findByEmail({ collection: "users", email: parsed.data.email });
if (user) {
  const collectionConfig = payload.collections.users.config;
  const fieldsToSign = getFieldsToSign({ collectionConfig, email: parsed.data.email, user });
  const { token } = await jwtSign({
    fieldsToSign,
    secret: process.env.PAYLOAD_SECRET || "",
    tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
  });
  setSessionCookie(cookieStore, token);
}
return { ok: true, data: { message: "registered" } };
```
- [ ] Rewrite `loginUser` to use REST API fetch instead of `payload.login()`:
```ts
export async function loginUser(input): Promise<ActionResult<{ token: string; verified: boolean }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return error("VALIDATION", parsed.error.issues[0]?.message || "Invalid data");

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  const loginRes = await fetch(`${serverUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
  });

  const payload = await getPayloadClient();
  const cookieStore = await cookies();

  if (loginRes.ok) {
    const data = await loginRes.json();
    setSessionCookie(cookieStore, data.token);
    return { ok: true, data: { token: data.token, verified: true } };
  }

  // Check if failure is due to unverified account
  const errBody = await loginRes.json().catch(() => ({}));
  const errMsg = errBody?.errors?.[0]?.message || errBody?.message || "";
  if (/verify|verification|verified/i.test(errMsg)) {
    const users = await payload.find({
      collection: "users",
      where: { email: { equals: parsed.data.email } },
      limit: 1,
      overrideAccess: true,
    });
    if (users.docs.length) {
      const userDoc = users.docs[0] as User;
      const collectionConfig = payload.collections.users.config;
      const fieldsToSign = getFieldsToSign({ collectionConfig, email: parsed.data.email, user: userDoc });
      const { token } = await jwtSign({
        fieldsToSign,
        secret: process.env.PAYLOAD_SECRET || "",
        tokenExpiration: collectionConfig.auth.tokenExpiration ?? 7200,
      });
      setSessionCookie(cookieStore, token);
      return { ok: true, data: { token, verified: false } };
    }
  }

  return error("UNAUTHENTICATED", "Invalid credentials");
}
```
- [ ] Add `setSessionFromToken`:
```ts
export async function setSessionFromToken(token: string): Promise<ActionResult<true>> {
  if (!token) return error("VALIDATION", "Missing token");
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, token);
  return { ok: true, data: true };
}
```
- [ ] Add `resendVerificationEmail`:
```ts
export async function resendVerificationEmail(email: string): Promise<ActionResult<true>> {
  if (!email) return error("VALIDATION", "Missing email");
  const payload = await getPayloadClient();
  const users = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  if (!users.docs.length) return { ok: true, data: true };

  const user = users.docs[0];
  if (user._verified) return { ok: true, data: true };

  const { token } = await jwtSign({
    fieldsToSign: { id: user.id, email: user.email },
    secret: process.env.PAYLOAD_SECRET || "",
    tokenExpiration: 86400,
  });

  const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/verify?token=${token}`;
  await payload.sendEmail({
    to: email,
    subject: "Xaqiiji iimaylkaaga Qiimale",
    html: `<p>Fadlan xaqiiji iimaylkaaga qiimaynta Qiimale:</p><p><a href="${url}">${url}</a></p>`,
  });
  return { ok: true, data: true };
}
```

---

### Task 3: OAuth session bridge

**Files:**
- Create: `src/app/auth/callback/page.tsx`
- Modify: `src/app/api/auth/google/callback/route.ts`

**Interfaces:**
- Consumes: `setSessionFromToken` from Task 2

- [ ] Create `src/app/auth/callback/page.tsx`:
```ts
import { redirect } from "next/navigation";
import { setSessionFromToken } from "@/lib/actions/auth";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const { token, next } = await searchParams;
  if (!token) redirect("/login?error=1");
  await setSessionFromToken(token);
  redirect(next || "/");
}
```
- [ ] In `src/app/api/auth/google/callback/route.ts`, replace the cookie-setting block (lines 100-108):
```ts
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  return NextResponse.redirect(`${serverUrl}/auth/callback?token=${token}`);
```
Remove the `SESSION_COOKIE` import since it's no longer needed here.

---

### Task 4: Verify-email page

**Files:**
- Create: `src/app/(frontend)/[locale]/verify-email/page.tsx`
- Modify: `src/app/(frontend)/[locale]/components/RegisterForm.tsx`

**Interfaces:**
- Consumes: `resendVerificationEmail` from Task 2

- [ ] Create verify-email page:
```ts
import { AuthCheckPrompt } from "@/app/(frontend)/[locale]/components/AuthCheckPrompt";
// or inline - a server component that reads email from searchParams
// and renders a simple "check your inbox" UI with resend button
```
Actually, since the resend needs client-side cooldown, I'll make a client component. Let me keep it simple - a server component with a client `ResendButton`:

```tsx
// src/app/(frontend)/[locale]/components/ResendButton.tsx
"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";

export function ResendButton({ email }: { email: string }) {
  const t = useTranslations("Auth");
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setSent(false);
    await resendVerificationEmail(email);
    setSent(true);
    setCooldown(60);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        className="text-primary hover:underline font-semibold text-sm disabled:opacity-50 disabled:no-underline cursor-pointer"
      >
        {cooldown > 0 ? t("resendCooldown", { seconds: cooldown }) : t("resendVerification")}
      </button>
      {sent && <p className="text-xs text-emerald-600">{t("resendSuccess")}</p>}
    </div>
  );
}
```

```tsx
// src/app/(frontend)/[locale]/verify-email/page.tsx
import { Envelope } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResendButton } from "../components/ResendButton";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const t = await getTranslations("Auth");
  const { email } = await searchParams;
  const decodedEmail = email ? decodeURIComponent(email) : "";

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
      <Envelope className="mx-auto text-primary" size={48} />
      <h1 className="text-xl font-bold">{t("verifyEmailTitle")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("verifyEmailHint", { email: decodedEmail })}
      </p>
      {decodedEmail && <ResendButton email={decodedEmail} />}
      <p className="text-xs text-muted-foreground">{t("checkSpam")}</p>
      <Link
        href="/login"
        className="inline-block text-sm text-primary hover:underline font-semibold"
      >
        {t("login")}
      </Link>
    </div>
  );
}
```
- [ ] In `RegisterForm.tsx`, replace `setMsg(t("emailSent"))` with redirect:
```ts
import { useRouter } from "next/navigation";
// Inside onSubmit, after the success check:
router.push(`/verify-email?email=${encodeURIComponent(String(fd.get("email") ?? ""))}`);
```
Remove the `msg` state since it's no longer used inline.

---

### Task 5: Forgot password pages

**Files:**
- Create: `src/app/(frontend)/[locale]/forgot-password/page.tsx`
- Create: `src/app/(frontend)/[locale]/reset-password/page.tsx`
- Modify: `src/app/(frontend)/[locale]/components/LoginForm.tsx`

- [ ] Create forgot-password page:
```ts
"use client";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get("email");
    const res = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setPending(false);
    if (res.ok) { setSent(true); return; }
    setErr(t("resetPasswordError"));
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
        <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
        <h1 className="text-xl font-bold">{t("forgotPasswordSent")}</h1>
        <Link href="/login" className="text-primary hover:underline font-semibold text-sm">{t("login")}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-1">
          <Mail className="mx-auto text-primary" size={32} />
          <h1 className="text-2xl font-extrabold">{t("forgotPasswordTitle")}</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="email" type="email" placeholder={t("email")} required
            className="w-full rounded-lg border px-4 py-3" />
          {err && <div className="flex items-center gap-2 text-xs text-destructive"><AlertCircle size={14} />{err}</div>}
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {pending ? <><Loader2 size={16} className="animate-spin" />...</> : t("forgotPasswordTitle")}
          </button>
        </form>
        <p className="text-center text-xs"><Link href="/login" className="text-primary hover:underline font-semibold">{t("login")}</Link></p>
      </div>
    </div>
  );
}
```
- [ ] Create reset-password page:
```ts
"use client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { token } = await searchParams;
    if (!token) { setErr(t("resetPasswordError")); setPending(false); return; }
    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: fd.get("password") }),
    });
    setPending(false);
    if (res.ok) { router.push("/login?reset=true"); return; }
    setErr(t("resetPasswordError"));
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h1 className="text-2xl font-extrabold text-center">{t("resetPassword")}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="password" type="password" placeholder={t("password")} required minLength={8}
            className="w-full rounded-lg border px-4 py-3" />
          {err && <div className="flex items-center gap-2 text-xs text-destructive"><AlertCircle size={14} />{err}</div>}
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {pending ? <><Loader2 size={16} className="animate-spin" />...</> : t("resetPassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
```
- [ ] In `LoginForm.tsx`, add forgot-password link below the password field (before the submit button):
```tsx
<div className="text-right">
  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
    {t("forgotPassword")}
  </Link>
</div>
```

---

### Task 6: Access control on write collections

**Files:**
- Modify: `src/collections/Places.ts`

- [ ] In `src/collections/Places.ts`, change `create: authenticated` to `create: verifiedOnly`:
```ts
import { verifiedOnly } from "../access/verifiedOnly";
// ...
access: {
  read: publishedPlaces,
  create: verifiedOnly,
  update: isAdmin,
  delete: isAdmin,
},
```
- [ ] `Reviews.ts` already has `create: verifiedOnly` — no change needed.
- [ ] In `src/collections/ReviewUpvotes.ts`, change `create: authenticated` to `create: verifiedOnly`:
```ts
import { verifiedOnly } from "../access/verifiedOnly";
// ...
access: {
  read: () => true,
  create: verifiedOnly,
  update: () => false,
  delete: authenticated,
},
```

---

### Task 7: Login page updates

**Files:**
- Modify: `src/app/(frontend)/[locale]/login/page.tsx`

- [ ] Handle `?verified=true`, `?reset=true`, and `?unverified=true` params, passing them to `LoginForm`:
```tsx
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  return (
    <LoginForm
      existingUser={Boolean(user)}
      showVerified={params.verified === "true"}
      showReset={params.reset === "true"}
    />
  );
}
```
- [ ] In `LoginForm.tsx`, add props and show success/error banners at the top:
```tsx
export function LoginForm({
  existingUser,
  showVerified,
  showReset,
}: {
  existingUser?: boolean;
  showVerified?: boolean;
  showReset?: boolean;
}) {
  // Inside return, before the form:
  {showVerified && (
    <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 text-center">
      <CheckCircle2 size={16} className="inline mr-1" />{t("verifiedSuccess")}
    </div>
  )}
  {showReset && (
    <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 text-center">
      <CheckCircle2 size={16} className="inline mr-1" />{t("passwordResetSuccess")}
    </div>
  )}
  // In the onSubmit handler, always redirect to /account (account page shows verified status):
  router.push("/account");
  router.refresh();
```

---

### Task 8: Account page resend verification

**Files:**
- Modify: `src/app/(frontend)/[locale]/account/page.tsx`

- [ ] Add resend button for unverified users in the account page profile header:
```tsx
// After the unverified status span (line ~78), add:
{!user._verified && (
  <ResendButton email={user.email} />
)}
```
Import `ResendButton` from `../components/ResendButton` (created in Task 4).
