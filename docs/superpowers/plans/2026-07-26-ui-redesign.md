# Qiimale UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Qiimale from a generic grayscale UI into a trustworthy, professional review platform with a blue primary palette, amber stars, Plus Jakarta Sans + Inter typography, and clean card styling.

**Architecture:** Pure CSS/Tailwind class changes across 21 existing files. No new components, no logic changes, no structural/layout changes. Each task modifies specific className strings in existing components.

**Tech Stack:** Next.js 16, Tailwind CSS v4 (theme inline in globals.css), next/font/google, Lucide icons

---

## File Map

| File | Changes |
|------|---------|
| `src/app/(frontend)/globals.css` | Replace oklch grayscale tokens with blue primary palette, update font vars |
| `src/app/(frontend)/[locale]/layout.tsx` | Swap Geist fonts for Plus Jakarta Sans + Inter, redesign footer |
| `src/app/(frontend)/[locale]/components/Header.tsx` | Sticky backdrop-blur header, filled CTA button, pill language switcher |
| `src/app/(frontend)/[locale]/page.tsx` | Blue hero, trust stats, category cards with blue accents, section headers |
| `src/app/(frontend)/[locale]/components/PlaceCard.tsx` | Clean border card, blue hover, amber stars |
| `src/app/(frontend)/[locale]/components/ReviewCard.tsx` | Blue avatar, clean border, amber stars |
| `src/app/(frontend)/[locale]/components/StarRating.tsx` | amber-400 → amber-500 |
| `src/app/(frontend)/[locale]/components/LoginForm.tsx` | Blue focus states, visible labels |
| `src/app/(frontend)/[locale]/components/RegisterForm.tsx` | Blue focus states, visible labels |
| `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` | Blue focus states, visible labels |
| `src/app/(frontend)/[locale]/components/ReviewForm.tsx` | Blue focus states, visible labels |
| `src/app/(frontend)/[locale]/components/UpvoteButton.tsx` | Already uses blue-600, no changes needed |
| `src/app/(frontend)/[locale]/components/FlagButton.tsx` | Consistent styling |
| `src/app/(frontend)/[locale]/components/LanguageSwitcher.tsx` | Pill styling with globe icon |
| `src/app/(frontend)/[locale]/search/page.tsx` | Consistent card styling |
| `src/app/(frontend)/[locale]/place/[slug]/page.tsx` | Place detail styling updates |
| `src/app/(frontend)/[locale]/account/page.tsx` | Account page styling |

---

### Task 1: Theme Foundation — globals.css

**Files:**
- Modify: `src/app/(frontend)/globals.css`

- [ ] **Step 1: Replace `:root` CSS variables with blue primary palette**

Replace the entire `:root` block (lines 51–84) with:

```css
:root {
  --background: oklch(0.975 0.002 250);    /* slate-50 #F8FAFC */
  --foreground: oklch(0.145 0.005 250);     /* slate-900 #0F172A */
  --card: oklch(1 0 0);                     /* white */
  --card-foreground: oklch(0.145 0.005 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0.005 250);
  --primary: oklch(0.546 0.245 262.8);      /* blue-600 #2563EB */
  --primary-foreground: oklch(0.985 0 0);   /* white */
  --secondary: oklch(0.97 0.003 250);       /* slate-100 #F1F5F9 */
  --secondary-foreground: oklch(0.145 0.005 250);
  --muted: oklch(0.965 0.003 250);          /* slate-100 */
  --muted-foreground: oklch(0.556 0.015 250); /* slate-500 #64748B */
  --accent: oklch(0.97 0.003 250);
  --accent-foreground: oklch(0.145 0.005 250);
  --destructive: oklch(0.577 0.245 27.325); /* red-600 #DC2626 */
  --border: oklch(0.922 0.005 250);         /* slate-200 #E2E8F0 */
  --input: oklch(0.922 0.005 250);
  --ring: oklch(0.546 0.245 262.8);         /* blue-600 */
  --chart-1: oklch(0.546 0.245 262.8);
  --chart-2: oklch(0.623 0.214 259.8);      /* blue-500 */
  --chart-3: oklch(0.455 0.245 262.8);      /* blue-700 */
  --chart-4: oklch(0.398 0.229 262.8);      /* blue-800 */
  --chart-5: oklch(0.912 0.157 96.6);       /* amber-400 */
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0.003 250);
  --sidebar-foreground: oklch(0.145 0.005 250);
  --sidebar-primary: oklch(0.546 0.245 262.8);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.965 0.003 250);
  --sidebar-accent-foreground: oklch(0.145 0.005 250);
  --sidebar-border: oklch(0.922 0.005 250);
  --sidebar-ring: oklch(0.546 0.245 262.8);
}
```

- [ ] **Step 2: Update `body` background to slate-50**

In the `@layer base` block, change:

```css
body {
  @apply bg-[oklch(0.975_0.002_250)] text-foreground;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(frontend)/globals.css
git commit -m "style: update theme colors to blue primary palette"
```

---

### Task 2: Typography — Layout Fonts

**Files:**
- Modify: `src/app/(frontend)/[locale]/layout.tsx`

- [ ] **Step 1: Replace Geist imports with Plus Jakarta Sans + Inter**

Replace lines 1–14 of `layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "./components/Header";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
```

- [ ] **Step 2: Update `<html>` className**

Replace the `<html>` tag (line 40-42):

```tsx
    <html
      lang={locale}
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
```

- [ ] **Step 3: Update body class to use Inter**

Replace the `<body>` tag (line 44):

```tsx
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
```

- [ ] **Step 4: Add CSS font variables to globals.css `@theme inline` block**

Add these lines inside the `@theme inline { }` block in `globals.css` (after the existing `--font-heading` line):

```css
  --font-jakarta: var(--font-jakarta);
  --font-inter: var(--font-inter);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/layout.tsx src/app/\(frontend\)/globals.css
git commit -m "style: swap Geist for Plus Jakarta Sans + Inter"
```

---

### Task 3: Footer Redesign

**Files:**
- Modify: `src/app/(frontend)/[locale]/layout.tsx`

- [ ] **Step 1: Replace the footer element**

Replace the `<footer>` element (lines 48-50):

```tsx
          <footer className="bg-slate-900 text-white">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                  <span className="font-[family-name:var(--font-jakarta)] text-xl font-bold">Qiimale</span>
                  <p className="mt-2 text-sm text-slate-400">
                    {locale === "so" ? "Qiimayn goobo & adeegyo Soomaaliya" : "Rate places & services in Somalia"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Quick links</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li><a href="/search" className="hover:text-white transition-colors">Search</a></li>
                    <li><a href="/add-place" className="hover:text-white transition-colors">Add a place</a></li>
                    <li><a href="/search" className="hover:text-white transition-colors">Categories</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">About</h3>
                  <p className="mt-3 text-sm text-slate-400">
                    {locale === "so"
                      ? "Qiimale waa goob loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada Soomaaliya."
                      : "Qiimale is a platform for reviewing places and services in Somalia."}
                  </p>
                </div>
              </div>
              <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
                Qiimale © {new Date().getFullYear()} · Made in Somalia
              </div>
            </div>
          </footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/layout.tsx
git commit -m "style: redesign footer with 3-column dark layout"
```

---

### Task 4: Header Redesign

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/Header.tsx`

- [ ] **Step 1: Replace the entire Header component**

Replace the full file content:

```tsx
import { Globe, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 h-16 backdrop-blur-sm bg-[oklch(0.975_0.002_250)]/80 border-b border-[oklch(0.922_0.005_250)]/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-foreground">
          Qiimale
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/search" className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
            {t("search")}
          </Link>
          <Link
            href="/add-place"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {t("addPlace")}
          </Link>
          {user ? (
            <Link href="/account" className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
              {t("account")}
            </Link>
          ) : (
            <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
              {t("login")}
            </Link>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/Header.tsx
git commit -m "style: redesign header with backdrop blur and filled CTA"
```

---

### Task 5: Language Switcher Pill

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/LanguageSwitcher.tsx`

- [ ] **Step 1: Replace the button styling**

Replace the `<button>` element (lines 17-23):

```tsx
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
    >
      <Globe size={14} />
      {t("language")}
    </button>
  );
```

- [ ] **Step 2: Add Globe import**

Add `Globe` to the lucide-react import at line 2:

```tsx
import { Globe } from "lucide-react";
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/LanguageSwitcher.tsx
git commit -m "style: add pill styling with globe icon to language switcher"
```

---

### Task 6: Homepage Hero + Categories + Section Headers

**Files:**
- Modify: `src/app/(frontend)/[locale]/page.tsx`

- [ ] **Step 1: Update SectionHeader with blue accent**

Replace the `SectionHeader` component (lines 9-32):

```tsx
function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
        {title}
      </h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          {linkLabel}
          <Icons.ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Replace the Hero section**

Replace the hero `<section>` (lines 67-99):

```tsx
      {/* Hero */}
      <section className="relative overflow-hidden bg-blue-600 px-4 py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl font-[family-name:var(--font-jakarta)]">
            {t("App.name")}
          </h1>
          <p className="mt-3 text-lg text-white/80 sm:text-xl">
            {t("App.tagline")}
          </p>
          <form action="/search" className="relative mt-8 max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg flex items-center">
              <Icons.Search
                className="pointer-events-none ml-4 size-5 text-muted-foreground"
                aria-hidden
              />
              <input
                name="q"
                placeholder={t("Search.placeholder")}
                className="flex-1 bg-transparent py-3.5 px-3 text-base outline-none placeholder:text-muted-foreground"
                aria-label={t("Search.placeholder")}
              />
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl m-1.5 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              >
                {t("Home.searchButton")}
              </button>
            </div>
          </form>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
            <Icons.MapPin size={14} />
            <span>200+ Places · 500+ Reviews · 10+ Cities</span>
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Replace category card styling**

Replace the category card `<Link>` (lines 114-126):

```tsx
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2.5 border border-border bg-white rounded-xl p-5 text-center transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {cat.name}
                  </span>
                </Link>
```

- [ ] **Step 4: Replace latest review card styling**

Replace the review link (lines 163-178):

```tsx
                  <li key={r.id}>
                  <Link
                    href={`/place/${place.slug}`}
                    className="block border border-border bg-white rounded-xl p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-foreground leading-snug">
                        {place.name}
                      </span>
                      <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                        {r.rating}★
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {preview}
                    </p>
                  </Link>
                </li>
```

- [ ] **Step 5: Add MapPin import**

The file already imports `* as Icons` from lucide-react which includes MapPin, so no additional import needed.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/page.tsx
git commit -m "style: redesign hero, category cards, and section headers"
```

---

### Task 7: PlaceCard Redesign

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/PlaceCard.tsx`

- [ ] **Step 1: Replace the Link className**

Replace line 33:

```tsx
      className="group block border border-border bg-white rounded-xl p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-sm hover:border-l-2 hover:border-l-blue-500"
```

- [ ] **Step 2: Update place name hover color**

Replace line 37:

```tsx
          <div className="font-semibold text-foreground leading-snug group-hover:text-blue-600">
```

- [ ] **Step 3: Update icon circle to blue-50/blue-600**

Replace line 46:

```tsx
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
```

Remove the `className` prop from `<Icon>` on line 47 since color is now on the container:

```tsx
            <Icon size={18} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/PlaceCard.tsx
git commit -m "style: redesign place card with blue accents"
```

---

### Task 8: ReviewCard Redesign

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/ReviewCard.tsx`

- [ ] **Step 1: Update the article wrapper**

Replace line 55:

```tsx
    <article className="border border-border bg-white rounded-xl p-6 text-card-foreground space-y-4">
```

- [ ] **Step 2: Update avatar circle to blue-100/blue-700**

Replace line 58:

```tsx
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
```

- [ ] **Step 3: Update photo thumbnail borders**

Replace line 96:

```tsx
                className="group relative block h-20 w-20 overflow-hidden rounded-lg ring-1 ring-border bg-muted"
```

- [ ] **Step 4: Update divider to use border-border**

Replace line 110:

```tsx
      <div className="flex items-center justify-between border-t border-border pt-4">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/ReviewCard.tsx
git commit -m "style: redesign review card with blue avatar and clean borders"
```

---

### Task 9: StarRating — Amber-500

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/StarRating.tsx`

- [ ] **Step 1: Replace all amber-400 with amber-500**

Use replaceAll to change both occurrences:

```tsx
fill-amber-500 text-amber-500
```

Replace `fill-amber-400 text-amber-400` with `fill-amber-500 text-amber-500` (appears twice).

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/StarRating.tsx
git commit -m "style: update star rating to amber-500"
```

---

### Task 10: LoginForm Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/LoginForm.tsx`

- [ ] **Step 1: Update input focus classes**

Replace all instances of the input className pattern. Find each `<input>` with `focus-visible:ring-ring` and replace with `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`. There are 2 inputs (email and password).

Replace on line 89:

```tsx
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
```

Replace on line 106:

```tsx
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
```

- [ ] **Step 2: Update submit button**

Replace line 120:

```tsx
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
```

- [ ] **Step 3: Update Google OAuth button**

Replace line 147:

```tsx
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-muted/50 transition-all"
```

- [ ] **Step 4: Update existing user card border**

Replace line 24:

```tsx
      <div className="bg-white border border-border rounded-2xl p-6 max-w-sm mx-auto text-center space-y-4">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/LoginForm.tsx
git commit -m "style: update login form with blue focus states and clean styling"
```

---

### Task 11: RegisterForm Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/RegisterForm.tsx`

- [ ] **Step 1: Update input focus classes**

Replace all 3 input classNames (name, email, password) with the new pattern:

```tsx
className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
```

- [ ] **Step 2: Update submit button**

Replace line 123:

```tsx
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
```

- [ ] **Step 3: Update Google OAuth button**

Replace line 150:

```tsx
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-muted/50 transition-all"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/RegisterForm.tsx
git commit -m "style: update register form with blue focus states"
```

---

### Task 12: AddPlaceForm Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx`

- [ ] **Step 1: Update form wrapper**

Replace line 82:

```tsx
      className="space-y-6 max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
```

- [ ] **Step 2: Update all input/select/textarea focus classes**

Replace all instances of the old input className pattern with:

```tsx
className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
```

There are 5 form elements: name input, category select, city select, address input, description textarea.

- [ ] **Step 3: Update submit button**

Replace line 203:

```tsx
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/AddPlaceForm.tsx
git commit -m "style: update add place form with blue focus states"
```

---

### Task 13: ReviewForm Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/ReviewForm.tsx`

- [ ] **Step 1: Update form wrapper**

Replace line 98:

```tsx
      className="space-y-6 max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
```

- [ ] **Step 2: Update textarea focus classes**

Replace line 125:

```tsx
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-y"
```

- [ ] **Step 3: Update submit button**

Replace line 189:

```tsx
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
```

- [ ] **Step 4: Update upload dashed border**

Replace line 161:

```tsx
            <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all text-center p-2">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/ReviewForm.tsx
git commit -m "style: update review form with blue focus states"
```

---

### Task 14: FlagButton Consistent Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/FlagButton.tsx`

- [ ] **Step 1: Update flagged state amber fill**

Line 45 already uses `fill-current text-amber-500` — no change needed.

- [ ] **Step 2: Update flag button hover color**

Replace line 56:

```tsx
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
```

No change needed — already correct.

- [ ] **Step 3: Update dropdown item hover**

Replace line 79:

```tsx
              className="block w-full px-2 py-1.5 text-left hover:bg-muted rounded-md transition-colors disabled:opacity-50 cursor-pointer"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/FlagButton.tsx
git commit -m "style: minor flag button styling consistency"
```

---

### Task 15: Search Page Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/search/page.tsx`

- [ ] **Step 1: Update search input styling**

Replace line 74:

```tsx
          className="w-full rounded-2xl border border-border bg-white py-3.5 pl-12 pr-4 text-base shadow-sm transition-shadow placeholder:text-muted-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
```

- [ ] **Step 2: Update results heading**

Replace line 78:

```tsx
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
        {t("results")}
      </h1>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/search/page.tsx
git commit -m "style: update search page with consistent card styling"
```

---

### Task 16: Place Detail Page

**Files:**
- Modify: `src/app/(frontend)/[locale]/place/[slug]/page.tsx`

- [ ] **Step 1: Update main info card**

Replace line 96:

```tsx
      <div className="rounded-2xl border border-border bg-white text-card-foreground p-6 sm:p-8 relative overflow-hidden">
```

- [ ] **Step 2: Update write review button**

Replace line 146:

```tsx
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md cursor-pointer"
```

- [ ] **Step 3: Update rating breakdown card**

Replace line 158:

```tsx
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
```

- [ ] **Step 4: Update sort options background**

Replace line 199:

```tsx
            <div className="flex items-center gap-3 text-xs bg-muted p-1 rounded-lg border border-border">
```

- [ ] **Step 5: Update empty reviews state**

Replace line 223:

```tsx
            <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 text-muted-foreground space-y-2">
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/place/\[slug\]/page.tsx
git commit -m "style: update place detail page styling"
```

---

### Task 17: Review Form Page

**Files:**
- Modify: `src/app/(frontend)/[locale]/place/[slug]/review/page.tsx`

- [ ] **Step 1: Update verify email card**

Replace line 21:

```tsx
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-border bg-white text-center space-y-4">
```

- [ ] **Step 2: Update heading font**

Replace line 54:

```tsx
        <h1 className="text-2xl font-bold font-[family-name:var(--font-jakarta)] tracking-tight">
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/place/\[slug\]/review/page.tsx
git commit -m "style: update review form page styling"
```

---

### Task 18: Account Page

**Files:**
- Modify: `src/app/(frontend)/[locale]/account/page.tsx`

- [ ] **Step 1: Update profile header card**

Replace line 48:

```tsx
      <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
```

- [ ] **Step 2: Update avatar circle**

Replace line 49:

```tsx
        <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0">
```

- [ ] **Step 3: Update review/place cards**

Replace all instances of `shadow-2xs hover:border-primary/50` with `hover:border-blue-200 hover:shadow-sm`:

Line 117:
```tsx
                    className="rounded-xl border border-border bg-white p-4 space-y-2 hover:border-blue-200 hover:shadow-sm transition-all"
```

Line 173:
```tsx
                  className="rounded-xl border border-border bg-white p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all"
```

- [ ] **Step 4: Update empty state dashed borders**

Lines 94 and 155 — update both:

```tsx
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/account/page.tsx
git commit -m "style: update account page with consistent styling"
```

---

### Task 19: Verify Page Styling

**Files:**
- Modify: `src/app/(frontend)/[locale]/verify/page.tsx`

- [ ] **Step 1: Read the file to check current styling**

Read the file and update any card wrappers to use `border-border bg-white` instead of default `bg-card`.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/verify/page.tsx
git commit -m "style: update verify page styling"
```

---

### Task 20: UpvoteButton — Already Correct

**Files:**
- Modify: `src/app/(frontend)/[locale]/components/UpvoteButton.tsx`

- [ ] **Step 1: Verify UpvoteButton already uses blue-600**

The UpvoteButton already uses `hover:text-blue-600` and `text-blue-600` when upvoted (lines 34-35). No changes needed.

- [ ] **Step 2: Skip commit**

No changes to commit for this task.

---

### Task 21: Lint and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run Biome linter**

```bash
pnpm lint
```

Fix any lint errors that arise from the class changes.

- [ ] **Step 2: Run build to verify no compile errors**

```bash
pnpm build
```

- [ ] **Step 3: Final commit if lint fixes needed**

```bash
git add -A
git commit -m "style: fix lint issues from UI redesign"
```

---

## Success Criteria Checklist

- [ ] All pages use the new blue primary color palette (`#2563EB` / `blue-600`)
- [ ] Stars are amber-500 throughout
- [ ] Header has backdrop blur and filled CTA button
- [ ] Hero has solid blue background with trust stats
- [ ] Cards use clean borders (`border-border`), no `ring-1 ring-foreground/5` pattern
- [ ] Footer has 3-column dark layout
- [ ] Forms have visible labels and blue focus states
- [ ] Typography uses Plus Jakarta Sans (headings) + Inter (body)
- [ ] No Geist font references remain
- [ ] All hover states use blue-200 borders/shadows
