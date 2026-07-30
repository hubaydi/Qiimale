"use client";

import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createCategory } from "@/actions/categories";
import { createCity } from "@/actions/cities";
import { addPlace } from "@/actions/places";
import type { CategoryOption, CityOption } from "./types";
import { StepIndicator } from "./StepIndicator";
import { CreateModal } from "./CreateModal";
import { StepCitySelect } from "./StepCitySelect";
import { StepCategorySelect } from "./StepCategorySelect";
import { StepDetails } from "./StepDetails";

export function AddPlaceForm({
  cities: initialCities,
  categories: initialCategories,
}: {
  cities: CityOption[];
  categories: CategoryOption[];
}) {
  const t = useTranslations("AddPlace");
  const tErr = useTranslations("Errors");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>(initialCities);
  const [cats, setCats] = useState<CategoryOption[]>(initialCategories);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        categoryId: String(selectedCatId),
        cityId: String(selectedCityId),
        address: String(fd.get("address") || ""),
        description: String(fd.get("description") || ""),
      });
      if (!res.ok) {
        try {
          setErr(
            res.error.message ||
              tErr(res.error.code as Parameters<typeof tErr>[0]),
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

  function handleCityCreated(id: string, name: string) {
    setCities((prev) => [...prev, { id, name }]);
    setSelectedCityId(id);
  }

  function handleCategoryCreated(id: string, name: string, icon?: string) {
    setCats((prev) => [...prev, { id, name, icon }]);
    setSelectedCatId(id);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
    >
      <StepIndicator step={step} />

      {step === 1 && (
        <StepCitySelect
          cities={cities}
          selectedCityId={selectedCityId}
          onSelect={setSelectedCityId}
          onCreate={() => setCityModalOpen(true)}
        />
      )}
      {step === 2 && (
        <StepCategorySelect
          categories={cats}
          selectedCatId={selectedCatId}
          onSelect={setSelectedCatId}
          onCreate={() => setCatModalOpen(true)}
        />
      )}
      {step === 3 && (
        <StepDetails
          selectedCityId={selectedCityId}
          selectedCatId={selectedCatId}
          cities={cities}
          categories={cats}
        />
      )}

      {err && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{err}</span>
        </div>
      )}

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
          <div />
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

      <CreateModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        title={t("createCity")}
        label={t("cityName")}
        onSubmitAction={async (name) => {
          const res = await createCity(name);
          if (res.ok) handleCityCreated(res.data.id, name);
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
          if (res.ok) handleCategoryCreated(res.data.id, name, icon);
          return res;
        }}
      />
    </form>
  );
}
