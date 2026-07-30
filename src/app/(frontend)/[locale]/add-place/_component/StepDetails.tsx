"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CategoryOption, CityOption } from "./types";
import { getLocalizedName } from "./utils";

export function StepDetails({
  selectedCityId,
  selectedCatId,
  cities,
  categories,
}: {
  selectedCityId: string | null;
  selectedCatId: string | null;
  cities: CityOption[];
  categories: CategoryOption[];
}) {
  const t = useTranslations("AddPlace");
  const locale = useLocale();

  const city = selectedCityId
    ? cities.find((c) => c.id === selectedCityId)
    : undefined;
  const cat = selectedCatId
    ? categories.find((c) => c.id === selectedCatId)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {city && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">
            {getLocalizedName(city.name, locale)}
          </span>
        )}
        {cat && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
            {getLocalizedName(cat.name, locale)}
          </span>
        )}
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
