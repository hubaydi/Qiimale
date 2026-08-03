"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CategoryOption } from "./types";
import { getLocalizedName } from "./utils";

export function StepCategorySelect({
  categories,
  selectedCatId,
  onSelect,
  onCreate,
}: {
  categories: CategoryOption[];
  selectedCatId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
}) {
  const t = useTranslations("AddPlace");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <label
        htmlFor="category-select"
        className="block text-sm font-semibold text-foreground"
      >
        {t("selectCategory")}
      </label>
      <select
        id="category-select"
        value={selectedCatId || ""}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
      >
        <option value="">-- {t("selectCategory")} --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {getLocalizedName(c.name, locale)}
            {c.status === "pending" ? ` (${t("pendingSuffix")})` : ""}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
      >
        <Plus size={16} />
        <span>{t("createCategory")}</span>
      </button>
    </div>
  );
}
