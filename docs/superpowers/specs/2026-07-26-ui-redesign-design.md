# Qiimale UI Redesign — Design Spec

**Date:** 2026-07-26
**Status:** Approved
**Approach:** Trust Blue (A) — clean, credible, professional

## Problem

The current Qiimale UI looks generic — flat grayscale palette (zero chroma in all OKLCH values), Geist font with no character, repetitive card patterns with `ring-1 ring-foreground/5`, bare header/footer, and no visual identity connecting to the brand or Somali culture.

## Goal

Transform Qiimale into a trustworthy, professional review platform that users associate with credibility — similar to Google Maps, Yelp, or TripAdvisor — while maintaining the existing layout structure and functionality.

## Scope

- Light mode only (dark mode deferred)
- Color palette overhaul
- Typography change
- Component styling updates (cards, buttons, forms, header, footer)
- Hero section redesign
- No structural/layout changes to the app
- No new features or functionality changes

---

## Design System

### Color Palette

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Primary | `#2563EB` | `blue-600` | Buttons, links, active nav, primary actions |
| Primary hover | `#1D4ED8` | `blue-700` | Button/link hover states |
| Primary light | `#EFF6FF` | `blue-50` | Category icon backgrounds, subtle tints |
| Primary foreground | `#FFFFFF` | white | Text on primary-colored surfaces |
| Accent/Stars | `#F59E0B` | `amber-500` | Star ratings, highlighted badges |
| Accent hover | `#D97706` | `amber-600` | Star rating interactions |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Card | `#FFFFFF` | white | Card surfaces |
| Foreground | `#0F172A` | `slate-900` | Primary text |
| Muted | `#F1F5F9` | `slate-100` | Secondary backgrounds, icon circles |
| Muted foreground | `#64748B` | `slate-500` | Secondary text, dates, labels |
| Border | `#E2E8F0` | `slate-200` | Card borders, dividers |
| Destructive | `#DC2626` | `red-600` | Error states, flag button |
| Success | `#16A34A` | `green-600` | Success messages, verified badges |

### Typography

- **Headings:** Plus Jakarta Sans — weights 600 (semibold), 700 (bold)
- **Body:** Inter — weights 400 (regular), 500 (medium)
- **Scale:**
  - Body: `text-base` (16px), line-height 1.6
  - Small/labels: `text-sm` (14px)
  - H3: `text-xl` (20px) font-semibold
  - H2: `text-2xl` (24px) font-bold
  - H1: `text-3xl sm:text-4xl` (30-36px) font-bold
- **Font loading:** `font-display: swap` via `next/font/google`

### Spacing & Radius

- Base radius: `0.625rem` (keep existing `--radius` value)
- Cards: `rounded-xl` (12px)
- Buttons/inputs: `rounded-lg` (8px)
- Search bar/hero elements: `rounded-2xl` (16px)

---

## Component Specifications

### Header

- Sticky, `h-16`
- `backdrop-blur-sm bg-background/80` (frosted glass effect)
- Bottom border: `border-b border-border/50` (lighter than current)
- **Logo:** "Qiimale" in Plus Jakarta Sans bold (`text-xl font-bold text-foreground`)
- **Nav items:** `text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors`
- **"Add a place" button:** `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium` — filled CTA in the nav
- **Language switcher:** Pill with globe icon, `bg-muted text-muted-foreground rounded-lg px-3 py-1.5`

### Hero Section

- Full-width `bg-blue-600` background
- Subtle CSS texture overlay (low-opacity geometric pattern via `background-image`)
- Content: white text, centered
- Title: `text-4xl sm:text-5xl font-bold text-white`
- Tagline: `text-lg sm:text-xl text-white/80`
- Search bar: `bg-white rounded-2xl shadow-lg` with `max-w-xl mx-auto`
  - Search icon: `text-muted-foreground`
  - Input: clean, no visible border (white bg provides contrast)
  - Submit button: `bg-blue-700 hover:bg-blue-800 text-white` (slightly darker blue)
- Trust stats row below search: "X Places · X Reviews · X Cities" in `text-white/70` with small icons

### Category Cards

- `border border-border bg-white rounded-xl p-5`
- Icon circle: `bg-blue-50 text-blue-600 rounded-lg` (10→600 tint)
- Hover: `border-blue-200 shadow-sm` + icon `bg-blue-100`
- Text: `text-sm font-medium text-foreground`
- Transition: `transition-all duration-200`

### Place Cards

- `border border-border bg-white rounded-xl p-5`
- No ring-1 pattern (removed)
- Hover: `border-blue-200 shadow-sm` + left accent `border-l-2 border-l-blue-500`
- Place name: `font-semibold text-foreground group-hover:text-blue-600`
- Category/city: `text-sm text-muted-foreground`
- Category icon circle: `bg-blue-50 text-blue-600` (consistent with category cards)
- Star rating: `text-amber-500` (amber stars)
- Review count: `text-muted-foreground` with small review icon

### Review Cards

- `border border-border bg-white rounded-xl p-6` (no shadow-xs)
- Author avatar: `bg-blue-100 text-blue-700 rounded-full`
- Author name: `text-sm font-semibold text-foreground`
- Date: `text-xs text-muted-foreground`
- Star rating: `text-amber-500`
- Review text: `text-sm leading-relaxed text-foreground/90`
- Photo thumbnails: `rounded-lg ring-1 ring-border`
- Upvote button: `text-muted-foreground hover:text-blue-600` / `text-blue-600` when upvoted
- Divider: `border-t border-border`

### Section Headers

- Title: `text-xl font-semibold text-foreground`
- Small blue dot/dash accent before title (via `::before` pseudo-element or inline element)
- "View all" link: `text-sm text-blue-600 hover:text-blue-700` with ArrowRight icon

### Forms

- Card wrapper: `bg-white border border-border rounded-2xl p-6 sm:p-8`
- Labels: `text-sm font-medium text-slate-700` (visible, not placeholder-only)
- Inputs: `border border-slate-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none`
- Submit button: `bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium`
- Google OAuth: white bg, `border border-slate-300`, Google logo, `text-slate-700`
- Error state: `border-red-300` on input + `text-red-600` message below
- Success state: `border-green-300` + `text-green-600` message

### Footer

- `bg-slate-900` dark background
- 3-column layout (stacks on mobile):
  1. Brand: "Qiimale" white bold + tagline in `text-slate-400`
  2. Quick links: Search, Add a place, Categories — `text-slate-300 hover:text-white`
  3. About: Brief description in `text-slate-400`
- Bottom bar: `border-t border-slate-800` with copyright + "Made in Somalia"
- Padding: `py-12`

---

## Files to Modify

1. `src/app/(frontend)/globals.css` — Theme colors, typography imports
2. `src/app/(frontend)/[locale]/layout.tsx` — Font imports (Plus Jakarta Sans + Inter), footer redesign
3. `src/app/(frontend)/[locale]/components/Header.tsx` — Header redesign
4. `src/app/(frontend)/[locale]/page.tsx` — Hero section, category cards, section headers
5. `src/app/(frontend)/[locale]/components/PlaceCard.tsx` — Place card redesign
6. `src/app/(frontend)/[locale]/components/ReviewCard.tsx` — Review card redesign
7. `src/app/(frontend)/[locale]/components/StarRating.tsx` — Amber star color
8. `src/app/(frontend)/[locale]/components/LoginForm.tsx` — Form styling
9. `src/app/(frontend)/[locale]/components/RegisterForm.tsx` — Form styling
10. `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` — Form styling
11. `src/app/(frontend)/[locale]/components/ReviewForm.tsx` — Form styling
12. `src/app/(frontend)/[locale]/components/UpvoteButton.tsx` — Blue accent on upvoted
13. `src/app/(frontend)/[locale]/components/FlagButton.tsx` — Consistent styling
14. `src/app/(frontend)/[locale]/components/LanguageSwitcher.tsx` — Pill styling
15. `src/app/(frontend)/[locale]/login/page.tsx` — Form card wrapper
16. `src/app/(frontend)/[locale]/register/page.tsx` — Form card wrapper
17. `src/app/(frontend)/[locale]/add-place/page.tsx` — Form card wrapper
18. `src/app/(frontend)/[locale]/search/page.tsx` — Consistent card styling
19. `src/app/(frontend)/[locale]/place/[slug]/page.tsx` — Place detail page styling
20. `src/app/(frontend)/[locale]/place/[slug]/review/page.tsx` — Review form wrapper
21. `src/app/(frontend)/[locale]/account/page.tsx` — Account page styling

## Anti-Patterns to Avoid

- No emoji as icons (use Lucide SVG icons)
- No AI purple/pink gradients
- No playful or decorative elements — keep it professional
- No `ring-1 ring-foreground/5` on cards (the current generic pattern)
- No pure white `#FFFFFF` background for page (use `slate-50` instead)
- No Geist font (replace with Plus Jakarta Sans + Inter)

## Success Criteria

- [ ] All pages use the new blue primary color palette
- [ ] Stars are amber throughout
- [ ] Header has backdrop blur and filled CTA button
- [ ] Hero has solid blue background with trust stats
- [ ] Cards use clean borders, no ring pattern
- [ ] Footer has 3-column dark layout
- [ ] Forms have visible labels and blue focus states
- [ ] Typography uses Plus Jakarta Sans (headings) + Inter (body)
- [ ] No Geist font references remain
- [ ] All hover states use blue-200 borders/shadows
