# 3-Step Place Creation Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page `AddPlaceForm` with a 3-step wizard that lets authenticated users create cities and categories inline before adding a place.

**Architecture:** The wizard is a client component rendered on the existing `/add-place` page. Two new server actions (`createCity`, `createCategory`) handle city/category creation through Payload. The existing `addPlace` action is reused for final submission. City and Category collection access is relaxed from admin-only to authenticated-user for create operations. Step state is managed with `useState` + `useTransition`; modals are inline dialogs with backdrop.

**Tech Stack:** Next.js 15 (App Router), Payload CMS, next-intl (i18n), Zod (validation), Tailwind CSS.

**Design files:** `docs/superpowers/specs/2026-07-27-3-step-wizard-design.md`

## Global Constraints

- All new server actions must follow the pattern in `src/lib/actions/places.ts` — `"use server"`, Zod schema validation, `getCurrentUser()` auth check, `getPayloadClient()` for DB access, `ActionResult<T>` return type.
- Translations keys follow the existing `AddPlace` namespace prefix in `messages/en.json` and `messages/so.json`.
- The `authenticated` access function already exists at `src/access/authenticated.ts` as `({ req: { user } }) => Boolean(user)`.
- All components use Tailwind CSS classes consistent with the existing codebase (`rounded-2xl p-6 sm:p-8`, `bg-blue-600` for primary buttons, `bg-destructive/10 p-3` for error banners, etc.).
- No new npm dependencies required — all utilities already exist in the project.
- The page route at `src/app/(frontend)/[locale]/add-place/page.tsx` stays unchanged.

---

### Task 1: Relax City and Category Collection Access

**Files:**

- Modify: `src/collections/Cities.ts` (line 8)
- Modify: `src/collections/Categories.ts` (line 9)

**Interfaces:**

- Consumes: `authenticated` access function from `src/access/authenticated.ts`
- Produces: City collection allows any authenticated user to create; Category collection allows any authenticated user to create.

- [ ] **Step 1: Change Cities.ts `create` access**

Replace the `create: isAdmin` with `create: authenticated` and update the import.

```diff
- import { isAdmin } from "../access/isAdmin";
+ import { authenticated } from "../access/authenticated";
```

```diff
   access: {
     read: () => true,
-    create: isAdmin,
+    create: authenticated,
     update: isAdmin,
     delete: isAdmin,
   },
```

- [ ] **Step 2: Change Categories.ts `create` access**

Same change as Step 1, in the Categories collection:

```diff
- import { isAdmin } from "../access/isAdmin";
+ import { authenticated } from "../access/authenticated";
```

```diff
   access: {
     read: () => true,
-    create: isAdmin,
+    create: authenticated,
     update: isAdmin,
     delete: isAdmin,
   },
```

- [ ] **Step 3: Verify the edits compile**

Run: `npx next build --no-lint 2>&1 | head -30` (or `npm run build` equivalent)
Expected: No TS errors in Cities.ts or Categories.ts imports.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Cities.ts src/collections/Categories.ts
git commit -m "feat: allow authenticated users to create cities and categories"
```

---

### Task 2: Create `createCity` Server Action

**Files:**

- Create: `src/lib/actions/cities.ts`

**Interfaces:**

- Consumes: `ActionResult`, `error` from `@/lib/types`; `getPayloadClient` from `@/lib/get-payload`; `getCurrentUser` from `@/lib/session`; `z` from `zod`; `City` type from `@/payload-types`.
- Produces: `createCity(name: string): Promise<ActionResult<{ id: string }>>` — validates name, checks auth, creates city via Payload, returns new city ID.

- [ ] **Step 1: Create `src/lib/actions/cities.ts`**

```typescript
"use server";

import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { City } from "@/payload-types";

const schema = z.object({
  name: z.string().min(1, "City name is required"),
});

export async function createCity(
  name: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "City name is required",
    );
  }
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  const payload = await getPayloadClient();
  const created = (await payload.create({
    collection: "cities",
    data: {
      name: parsed.data.name,
      generateSlug: true,
    },
    overrideAccess: false,
    user,
  })) as City;
  return { ok: true, data: { id: created.id } };
}
```

- [ ] **Step 2: Run the build to verify**

Run: `npx next build --no-lint 2>&1 | head -30`
Expected: No import errors or type mismatches.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/cities.ts
git commit -m "feat: add createCity server action"
```

---

### Task 3: Create `createCategory` Server Action

**Files:**

- Create: `src/lib/actions/categories.ts`

**Interfaces:**

- Consumes: `ActionResult`, `error` from `@/lib/types`; `getPayloadClient`; `getCurrentUser`; `z`; `Category` type.
- Produces: `createCategory(name: string, icon?: string): Promise<ActionResult<{ id: string }>>` — validates name, checks auth, creates category with optional icon, returns new category ID.

- [ ] **Step 1: Create `src/lib/actions/categories.ts`**

```typescript
"use server";

import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Category } from "@/payload-types";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
});

export async function createCategory(
  name: string,
  icon?: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse({ name, icon });
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Category name is required",
    );
  }
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Please log in first.");
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {
    name: parsed.data.name,
    generateSlug: true,
  };
  if (parsed.data.icon) {
    data.icon = parsed.data.icon;
  }
  const created = (await payload.create({
    collection: "categories",
    data,
    overrideAccess: false,
    user,
  })) as Category;
  return { ok: true, data: { id: created.id } };
}
```

- [ ] **Step 2: Run the build to verify**

Run: `npx next build --no-lint 2>&1 | head -30`
Expected: No import errors or type mismatches.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/categories.ts
git commit -m "feat: add createCategory server action"
```

---

### Task 4: Add Translation Keys

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/so.json`

**Interfaces:**

- Consumes: The `AddPlace` namespace in both locale files — existing keys (`title`, `name`, `category`, `city`, `address`, `description`, `submit`, `success`).
- Produces: New keys under `AddPlace` for the wizard UI — `stepCity`, `stepCategory`, `stepDetails`, `selectCity`, `createCity`, `cityName`, `selectCategory`, `createCategory`, `categoryName`, `categoryIcon`, `back`, `next`, `create`, `cancel`, `saving`.

- [ ] **Step 1: Add English keys to `messages/en.json`**

Merge the following into the existing `"AddPlace"` object:

```json
{
  "stepCity": "City",
  "stepCategory": "Category",
  "stepDetails": "Details",
  "selectCity": "Select a city",
  "createCity": "Create new city",
  "cityName": "City name",
  "selectCategory": "Select a category",
  "createCategory": "Create new category",
  "categoryName": "Category name",
  "categoryIcon": "Icon (optional)",
  "back": "Back",
  "next": "Next",
  "create": "Create",
  "cancel": "Cancel",
  "saving": "Saving..."
}
```

- [ ] **Step 2: Add Somali keys to `messages/so.json`**

Merge the following into the existing `"AddPlace"` object:

```json
{
  "stepCity": "Magaalada",
  "stepCategory": "Qaybta",
  "stepDetails": "Faahfaahinta",
  "selectCity": "Dooro magaalo",
  "createCity": "Ku dar magaalo cusub",
  "cityName": "Magaca magaalada",
  "selectCategory": "Dooro qayb",
  "createCategory": "Ku dar qayb cusub",
  "categoryName": "Magaca qaybta",
  "categoryIcon": "Astaanta (ikhtiyaar)",
  "back": "Dib",
  "next": "Xiga",
  "create": "Abuur",
  "cancel": "Jooji",
  "saving": "Kaydinaya..."
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "const en = require('./messages/en.json'); const so = require('./messages/so.json'); console.log('EN keys:', Object.keys(en.AddPlace).length, 'SO keys:', Object.keys(so.AddPlace).length)"`
Expected: Both files parse without error and have matching key counts.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/so.json
git commit -m "feat: add wizard translation keys"
```

---

### Task 5: Rewrite AddPlaceForm as 3-Step Wizard

**Files:**

- Modify: `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` (full rewrite)

**Interfaces:**

- Consumes:
  - `addPlace(input)` from `@/lib/actions/places` — existing, unchanged signature
  - `createCity(name)` from `@/lib/actions/cities` — created in Task 2
  - `createCategory(name, icon?)` from `@/lib/actions/categories` — created in Task 3
  - `useTranslations("AddPlace")` — now includes the Task 4 keys
  - `useTranslations("Errors")` — for error code display (existing pattern)
  - `useLocale()` from `next-intl` — for localized city/category names
  - `useParams()` from `next/navigation` — for locale param if needed
- Produces: The wizard UI rendering steps 1-3, modals for city/category creation, and error display.

- [ ] **Step 1: Write the full component**

Replace `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` with the following. The file is a single self-contained component — no sub-components needed.

```tsx
"use client";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { addPlace } from "@/lib/actions/places";
import { createCategory } from "@/lib/actions/categories";
import { createCity } from "@/lib/actions/cities";

interface CategoryOption {
  id: string;
  name: string | { so?: string; en?: string };
  icon?: string | null;
}

interface CityOption {
  id: string;
  name: string | { so?: string; en?: string };
}

export function AddPlaceForm() {
  const t = useTranslations("AddPlace");
  const tErr = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();
  const { locale: localeParam } = useParams<{ locale: string }>();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [cats, setCats] = useState<CategoryOption[]>([]);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Load cities and categories on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/cities?limit=100").then((r) => r.json()),
      fetch("/api/categories?limit=100").then((r) => r.json()),
    ])
      .then(([c, cat]) => {
        setCities(c.docs || []);
        setCats(cat.docs || []);
      })
      .catch(() => {
        setErr("Failed to load data.");
      });
  }, []);

  function getLocalizedName(
    name: string | { so?: string; en?: string },
  ): string {
    if (typeof name === "string") return name;
    if (!name) return "";
    return (locale === "en" ? name.en : name.so) || name.so || name.en || "";
  }

  function getIcon(name: string | { so?: string; en?: string }): string {
    if (typeof name === "string") return "";
    return "";
  }

  // ---- Step indicator ----
  function StepIndicator() {
    const steps = [
      { num: 1, key: "stepCity" },
      { num: 2, key: "stepCategory" },
      { num: 3, key: "stepDetails" },
    ] as const;

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => {
          const isActive = step === s.num;
          const isComplete = step > s.num;
          const isFuture = step < s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isComplete ? <Check size={16} /> : <span>{s.num}</span>}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "text-blue-600"
                    : isComplete
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {t(s.key)}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    isComplete ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ---- Create Modal ----
  function CreateModal({
    open,
    onClose,
    title,
    label,
    onSubmitAction,
    showIcon,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    label: string;
    onSubmitAction: (
      name: string,
      icon?: string,
    ) => Promise<
      | { ok: true; data: { id: string } }
      | { ok: false; error: { code: string; message: string } }
    >;
    showIcon?: boolean;
  }) {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [modalErr, setModalErr] = useState<string | null>(null);
    const [modalPending, setModalPending] = useState(false);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setModalErr(null);
      if (!name.trim()) {
        setModalErr(t("cityName")); // generic fallback — key is just for label
        return;
      }
      setModalPending(true);
      const res = await onSubmitAction(
        name.trim(),
        showIcon ? icon.trim() || undefined : undefined,
      );
      setModalPending(false);
      if (!res.ok) {
        try {
          setModalErr(
            tErr(res.error.code as Parameters<typeof tErr>[0]) ||
              res.error.message,
          );
        } catch {
          setModalErr(res.error.message);
        }
        return;
      }
      // Reset form and close
      setName("");
      setIcon("");
      onClose();
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              {label}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          {showIcon && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                {t("categoryIcon")}
              </label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={t("categoryIcon")}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>
          )}

          {modalErr && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{modalErr}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-50 transition-all cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={modalPending || !name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {modalPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("create")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- Step content renderers ----
  function renderStep1() {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground">
          {t("selectCity")}
        </label>
        <select
          value={selectedCityId || ""}
          onChange={(e) => setSelectedCityId(e.target.value || null)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        >
          <option value="">-- {t("selectCity")} --</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {getLocalizedName(c.name)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setCityModalOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{t("createCity")}</span>
        </button>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground">
          {t("selectCategory")}
        </label>
        <select
          value={selectedCatId || ""}
          onChange={(e) => setSelectedCatId(e.target.value || null)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        >
          <option value="">-- {t("selectCategory")} --</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {getLocalizedName(c.name)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setCatModalOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{t("createCategory")}</span>
        </button>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        {/* Selected badges */}
        <div className="flex gap-3 flex-wrap">
          {selectedCityId &&
            (() => {
              const city = cities.find((c) => c.id === selectedCityId);
              return city ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">
                  {getLocalizedName(city.name)}
                </span>
              ) : null;
            })()}
          {selectedCatId &&
            (() => {
              const cat = cats.find((c) => c.id === selectedCatId);
              return cat ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                  {getLocalizedName(cat.name)}
                </span>
              ) : null;
            })()}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-foreground"
          >
            {t("name")} *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder={
              locale === "so"
                ? "Tusaale: Maqaayadda Hiran"
                : "Example: Hiran Restaurant"
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-foreground"
          >
            {t("address")}
          </label>
          <input
            id="address"
            name="address"
            placeholder={
              locale === "so"
                ? "Kawaanka Bari, Wadada Degmada..."
                : "East Market, District Street..."
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-foreground"
          >
            {t("description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder={
              locale === "so"
                ? "Sharaxaad kooban oo ku saabsan goobtan..."
                : "Short description about this place..."
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-y"
          />
        </div>
      </div>
    );
  }

  // ---- Navigation ----
  function canGoNext(): boolean {
    if (step === 1) return selectedCityId !== null;
    if (step === 2) return selectedCatId !== null;
    return true;
  }

  function handleNext() {
    if (!canGoNext()) return;
    setErr(null);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function handleBack() {
    setErr(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const res = await addPlace({
        name: String(fd.get("name") || ""),
        categoryId: selectedCatId!,
        cityId: selectedCityId!,
        address: String(fd.get("address") || ""),
        description: String(fd.get("description") || ""),
      });
      if (!res.ok) {
        try {
          setErr(
            tErr(res.error.code as Parameters<typeof tErr>[0]) ||
              res.error.message,
          );
        } catch {
          setErr(res.error.message);
        }
        return;
      }
      router.push("/account");
      router.refresh();
    });
  }

  // ---- Modal callbacks ----
  function handleCityCreated(id: string) {
    // Re-fetch cities to get the new one with full data
    fetch("/api/cities?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setCities(data.docs || []);
        setSelectedCityId(id);
      })
      .catch(() => {
        // If re-fetch fails, at least update local state optimistically
        setSelectedCityId(id);
      });
  }

  function handleCategoryCreated(id: string) {
    fetch("/api/categories?limit=100")
      .then((r) => r.json())
      .then((data) => {
        setCats(data.docs || []);
        setSelectedCatId(id);
      })
      .catch(() => {
        setSelectedCatId(id);
      });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
    >
      {/* Step indicator */}
      <StepIndicator />

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Error banner */}
      {err && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>{t("back")}</span>
          </button>
        ) : (
          <div /> /* Spacer */
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext() || pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{t("next")}</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <span>{t("submit")}</span>
            )}
          </button>
        )}
      </div>

      {/* Modals */}
      <CreateModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        title={t("createCity")}
        label={t("cityName")}
        onSubmitAction={async (name) => {
          const res = await createCity(name);
          if (res.ok) handleCityCreated(res.data.id);
          return res;
        }}
      />
      <CreateModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={t("createCategory")}
        label={t("categoryName")}
        showIcon
        onSubmitAction={async (name, icon) => {
          const res = await createCategory(name, icon);
          if (res.ok) handleCategoryCreated(res.data.id);
          return res;
        }}
      />
    </form>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx next build --no-lint 2>&1 | head -40`
Expected: No TS errors in AddPlaceForm.tsx. If Payload type imports for `Category` in `categories.ts` or `City` in `cities.ts` cause issues with `overrideAccess: false` (because the type expects admin), cast similarly to how `addPlace` casts `data` with `as RequiredDataFromCollectionSlug<"places">` — the pattern is already used in the codebase.

- [ ] **Step 3: Test the wizard manually**

1. Start the dev server: `npm run dev`
2. Open `/add-place` in a logged-in session
3. Verify step indicator shows 3 circles with "City" active
4. Step 1: Select a city from dropdown, see "Next" become enabled, click Next
5. Step 2: Select a category, see "Next" become enabled, click Next
6. Step 3: Fill in place name and optional fields, verify city/category badges show above
7. Click "Back" to return to step 2 and then step 1 — verify selections are preserved
8. Go back to step 3, submit the form — verify redirect to /account
9. Test "Create new city": Step 1 > click "Create new city" > modal opens > type name > submit > modal closes > new city is selected in dropdown
10. Test "Create new category": Step 2 > click "Create new category" > modal opens > type name + icon > submit > modal closes > new category is selected
11. Test validation: try empty city/category name in modal -> error shown
12. Test unauthenticated: log out, go to `/add-place` -> should redirect to `/login` (page.tsx handles this)

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[locale\]/components/AddPlaceForm.tsx
git commit -m "feat: rewrite AddPlaceForm as 3-step wizard with inline city/category creation"
```

---

## Self-Review

### 1. Spec coverage

- ✅ Collections: Cities.ts `create` changed to `authenticated` (Task 1, Step 1)
- ✅ Collections: Categories.ts `create` changed to `authenticated` (Task 1, Step 2)
- ✅ Server action: `createCity(name)` in `src/lib/actions/cities.ts` (Task 2)
- ✅ Server action: `createCategory(name, icon?)` in `src/lib/actions/categories.ts` (Task 3)
- ✅ Translation keys for `messages/en.json` (Task 4, Step 1)
- ✅ Translation keys for `messages/so.json` (Task 4, Step 2)
- ✅ Wizard: step indicator with circles connected by lines, active filled, completed checkmark, future outlined (Task 5, `StepIndicator`)
- ✅ Step 1: select city dropdown + "Create new city" button + modal (Task 5)
- ✅ Step 2: select category dropdown + "Create new category" button + modal (Task 5)
- ✅ Step 3: name input (required), address input, description textarea, selected badges (Task 5)
- ✅ Next enabled only when selection non-null (Task 5, `canGoNext`)
- ✅ Back button on steps 2 and 3, no Back on step 1 (Task 5, `handleBack` + conditional render)
- ✅ Submit calls `addPlace` server action, redirects to `/account` (Task 5, `handleSubmit`)
- ✅ City modal: text input + Submit/Cancel + auto-select on creation (Task 5, `CreateModal` + `handleCityCreated`)
- ✅ Category modal: text input + optional icon input + Submit/Cancel + auto-select (Task 5, `CreateModal` + `handleCategoryCreated`)
- ✅ Error handling: server action errors shown as red banner below content (Task 5, `err` state + banner)
- ✅ Network failure on mount shows error (Task 5, `catch` in `useEffect`)
- ✅ `useTransition` for pending states (Task 5, `startTransition` / `pending`)
- ✅ No drag-and-drop, no fancy animations (not in scope)
- ✅ No edit/delete of cities/categories from wizard (not in scope)
- ✅ No pagination (limit=100) (not in scope)
- ✅ No image upload (not in scope)

### 2. Placeholder scan

No placeholders found — all code blocks contain complete implementation code with actual types, function signatures, JSX, and Tailwind classes. No "TBD", "TODO", or empty steps.

### 3. Type consistency

- `createCity(name: string)` → `ActionResult<{ id: string }>` — matches spec and is used consistently in the wizard's `CreateModal` callbacks.
- `createCategory(name: string, icon?: string)` → `ActionResult<{ id: string }>` — matches spec.
- `addPlace(input)` — unchanged, existing signature reused.
- `CityOption` / `CategoryOption` — same interfaces used in current `AddPlaceForm`, matched to `payload-types.ts` shapes.
- `useTranslations("AddPlace")` — all translation keys match Task 4 additions.
- All imports reference existing paths (`@/lib/actions/places`, `@/lib/types`, `@/lib/get-payload`, `@/lib/session`, `@/payload-types`).
- No dangling references to functions or types not defined in the plan.
