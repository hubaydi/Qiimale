"use client";

import { useLocale, useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryOption, CityOption } from "./types";
import { getLocalizedName } from "./utils";

export function StepDetails({
  selectedCityId,
  selectedCatId,
  cities,
  categories,
  register,
  errors,
}: {
  selectedCityId: string | null;
  selectedCatId: string | null;
  cities: CityOption[];
  categories: CategoryOption[];
  register: UseFormRegister<{
    name: string;
    address?: string;
    description?: string;
  }>;
  errors: FieldErrors<{ name: string; address?: string; description?: string }>;
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            {getLocalizedName(city.name, locale)}
          </span>
        )}
        {cat && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium">
            {getLocalizedName(cat.name, locale)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("name")} *</Label>
        <Input
          id="name"
          placeholder={
            locale === "so"
              ? "Tusaale: Maqaayadda Hiran"
              : "Example: Hiran Restaurant"
          }
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs font-medium text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("address")}</Label>
        <Input
          id="address"
          placeholder={
            locale === "so"
              ? "Kawaanka Bari, Wadada Degmada..."
              : "East Market, District Street..."
          }
          {...register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder={
            locale === "so"
              ? "Sharaxaad kooban oo ku saabsan goobtan..."
              : "Short description about this place..."
          }
          className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-y"
        />
      </div>
    </div>
  );
}
