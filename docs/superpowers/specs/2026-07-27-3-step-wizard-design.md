# 3-Step Place Creation Wizard

## Overview

Replace the current single-page `AddPlaceForm` with a 3-step wizard so users can create cities and categories inline before creating a place. Any authenticated user can create cities and categories (not just admins). Cities and categories are immediately active — no approval needed.

## Motivation

Users often try to add a place but the city or category they need doesn't exist yet. The current flow blocks them because they can't create cities/categories themselves. The wizard removes this friction by letting them create missing cities and categories on the fly.

## Collections Changes

### Cities (`src/collections/Cities.ts`)

- Change `access.create` from `isAdmin` → `authenticated` so any logged-in user can create a city.

### Categories (`src/collections/Categories.ts`)

- Change `access.create` from `isAdmin` → `authenticated` so any logged-in user can create a category.

No other schema changes — cities and categories have no `status` field, so they're immediately visible/usable.

## New Server Actions

### `src/lib/actions/cities.ts`

```ts
export async function createCity(name: string): Promise<ActionResult<{ id: string }>>
```

- Validates `name` is non-empty.
- Uses `getPayloadClient()` to create the city document.
- Returns the new city `id`.

### `src/lib/actions/categories.ts`

```ts
export async function createCategory(name: string, icon?: string): Promise<ActionResult<{ id: string }>>
```

- Validates `name` is non-empty.
- Uses `getPayloadClient()` to create the category document.
- `icon` is optional (maps to the `Categories.icon` field).
- Returns the new category `id`.

Both actions require authentication — return `UNAUTHENTICATED` if not logged in.

## Wizard Component

### File: `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` (rewrite)

Same route, same page shell (`/add-place`) — only the form content changes.

### State

```ts
const [step, setStep] = useState<1 | 2 | 3>(1);
const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
const [cities, setCities] = useState<CityOption[]>([]);
const [cats, setCats] = useState<CategoryOption[]>([]);
const [cityModalOpen, setCityModalOpen] = useState(false);
const [catModalOpen, setCatModalOpen] = useState(false);
const [err, setErr] = useState<string | null>(null);
const [pending, startTransition] = useTransition();
const { locale } = useParams(); // or useLocale()
```

### Layout

```
┌──────────────────────────────────────────┐
│  ○ City  ──── ○ Category ──── ○ Details  │  ← Step indicator
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  [Step-specific content below]     │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│                     [Back]    [Next/Submit]│
└──────────────────────────────────────────┘
```

The step indicator uses three circles connected by lines. The active step is filled/colored. Completed steps show a checkmark. Future steps are outlined/gray.

### Step 1 — Select or Create City

- Select dropdown listing all cities (`fetch("/api/cities?limit=100")`)
- Below the select: "Create new city" button (opens modal)
- **Next** enabled only when `selectedCityId` is non-null
- No Back button (first step)

### Step 2 — Select or Create Category

- Select dropdown listing all categories (`fetch("/api/categories?limit=100")`)
- Below the select: "Create new category" button (opens modal)
- **Back** returns to Step 1
- **Next** enabled only when `selectedCatId` is non-null

### Step 3 — Place Details

- Name input (required)
- Address input (optional)
- Description textarea (optional)
- Shows selected city and category as read-only badges above the form
- **Back** returns to Step 2
- **Submit** calls the existing `addPlace` server action
- On success: redirect to `/account`

### Modals for Creating City / Category

Reusable `<CreateModal>` inline component (or a simple dialog using a backdrop + card):

- **City modal**: text input for "City name" + Submit/Cancel buttons
- **Category modal**: text input for "Category name" + optional icon input + Submit/Cancel buttons
- On successful creation:
  - New item is added to the local `cities`/`cats` array
  - It is auto-selected
  - Modal closes
  - User stays on the same step
- On error: error message shown inside the modal
- "Create" button in the modal runs the corresponding server action via `startTransition`

### Error Handling

- Errors from server actions (`createCity`, `createCategory`, `addPlace`) are displayed as red alert banners below the form content (same pattern as current `AddPlaceForm`)
- Network failures loading cities/categories show an error on mount

### Internationalization

Add translation keys for the new UI:

**English (`messages/en.json`):**
```json
"AddPlace": {
  "title": "Add a new place",
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
  "name": "Place name",
  "address": "Address (optional)",
  "description": "Description (optional)",
  "submit": "Submit",
  "success": "Thanks! Your place was submitted and is pending admin review.",
  "back": "Back",
  "next": "Next",
  "create": "Create",
  "cancel": "Cancel",
  "saving": "Saving..."
}
```

**Somali (`messages/so.json`):** Same keys with Somali translations.

### Data Flow

```
[Step 1] Select City ──→ setSelectedCityId ──→ [Step 2] Select Category
                                                       ↓
                                              setSelectedCatId
                                                       ↓
                                              [Step 3] Fill Details
                                                       ↓
                                              addPlace({ name, categoryId, cityId, address, description })
                                                       ↓
                                              redirect /account
```

When user clicks "Create new city" / "Create new category":

```
[Modal opens] → user types name → submit → createCity(name) server action
                                                ↓
                                         new city created in DB
                                                ↓
                                         added to local cities array
                                                ↓
                                         auto-selected, modal closes
```

## Files Changed

| File | Change |
|------|--------|
| `src/collections/Cities.ts` | `create: authenticated` (was `isAdmin`) |
| `src/collections/Categories.ts` | `create: authenticated` (was `isAdmin`) |
| `src/lib/actions/cities.ts` | **New** — `createCity` server action |
| `src/lib/actions/categories.ts` | **New** — `createCategory` server action |
| `src/app/(frontend)/[locale]/components/AddPlaceForm.tsx` | **Rewrite** — 3-step wizard |
| `messages/en.json` | Add new `AddPlace` translation keys |
| `messages/so.json` | Add new `AddPlace` translation keys |

## Not In Scope

- Drag-and-drop or fancy animations between steps
- Editing/deleting cities or categories from the wizard
- Pagination for long city/category lists (using `limit=100` for now)
- Image upload for places
