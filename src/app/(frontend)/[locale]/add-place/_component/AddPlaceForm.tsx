"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCategory } from "@/actions/categories";
import { createCity } from "@/actions/cities";
import { addPlace } from "@/actions/places";
import { Button } from "@/components/ui/button";
import { CreateModal } from "./CreateModal";
import { StepCategorySelect } from "./StepCategorySelect";
import { StepCitySelect } from "./StepCitySelect";
import { StepDetails } from "./StepDetails";
import { StepIndicator } from "./StepIndicator";
import type { CategoryOption, CityOption } from "./types";

const addPlaceSchema = z.object({
  name: z.string().min(5).max(100),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
});

type AddPlaceFormValues = z.infer<typeof addPlaceSchema>;

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
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddPlaceFormValues>({
    resolver: zodResolver(addPlaceSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
    },
  });

  function canGoNext(): boolean {
    if (step === 1) return selectedCityId !== null;
    if (step === 2) return selectedCatId !== null;
    return true;
  }

  function handleNext() {
    if (!canGoNext()) return;
    setServerError(null);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
  }

  function handleBack() {
    setServerError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function onSubmit(data: AddPlaceFormValues) {
    setServerError(null);
    if (!selectedCityId || !selectedCatId) return;
    startTransition(async () => {
      const res = await addPlace({
        name: data.name,
        categoryId: selectedCatId,
        cityId: selectedCityId,
        address: data.address || "",
        description: data.description || "",
      });
      if (!res.ok) {
        setServerError(tErr(res.error.code) || res.error.message);
        return;
      }
      router.push("/account");
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
      onSubmit={handleSubmit(onSubmit)}
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
          register={register}
          errors={errors}
        />
      )}

      {serverError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
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
            disabled={!canGoNext() || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{t("next")}</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <span>{t("submit")}</span>
            )}
          </Button>
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
