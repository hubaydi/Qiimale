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
import { uploadMedia } from "@/actions/media";
import { addPlace } from "@/actions/places";
import { createService } from "@/actions/services";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";
import { CreateModal } from "./CreateModal";
import { StepCategorySelect } from "./StepCategorySelect";
import { StepCitySelect } from "./StepCitySelect";
import { StepDetails } from "./StepDetails";
import { StepIndicator } from "./StepIndicator";
import { StepServicesSelect } from "./StepServicesSelect";
import type { CategoryOption, CityOption, ServiceOption } from "./types";

const addPlaceSchema = z.object({
  name: z.string().min(5).max(100),
  address: z.string().optional(),
  description: z.string().max(1000).optional(),
});

type AddPlaceFormValues = z.infer<typeof addPlaceSchema>;

async function uploadPlaceImage(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res: ActionResult<{ id: string }> = await uploadMedia(fd);
  return res.ok ? res.data.id : null;
}

export function AddPlaceForm({
  cities: initialCities,
  categories: initialCategories,
  services: initialServices,
}: {
  cities: CityOption[];
  categories: CategoryOption[];
  services: ServiceOption[];
}) {
  const t = useTranslations("AddPlace");
  const tErr = useTranslations("Errors");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [cities, setCities] = useState<CityOption[]>(initialCities);
  const [cats, setCats] = useState<CategoryOption[]>(initialCategories);
  const [services, setServices] = useState<ServiceOption[]>(initialServices);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function onImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function onImageRemove() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

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
    if (step === 3) return true;
    return true;
  }

  function handleNext() {
    if (!canGoNext()) return;
    setServerError(null);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }

  function handleBack() {
    setServerError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  function onSubmit(data: AddPlaceFormValues) {
    setServerError(null);
    if (!selectedCityId || !selectedCatId) return;
    startTransition(async () => {
      let imageId: string | undefined;
      if (imageFile) {
        const id = await uploadPlaceImage(imageFile);
        if (id) imageId = id;
      }
      const res = await addPlace({
        name: data.name,
        categoryId: selectedCatId,
        cityId: selectedCityId,
        serviceIds: selectedServiceIds,
        address: data.address || "",
        description: data.description || "",
        imageId,
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

  function handleCategoryCreated(
    id: string,
    name: string,
    description?: string,
  ) {
    setCats((prev) => [...prev, { id, name, description }]);
    setSelectedCatId(id);
  }

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleServiceCreated(id: string, name: string) {
    setServices((prev) => [...prev, { id, name }]);
    setSelectedServiceIds((prev) => [...prev, id]);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-soft"
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
          <StepServicesSelect
            services={services}
            selectedIds={selectedServiceIds}
            onToggle={toggleService}
            onCreate={() => setServiceModalOpen(true)}
          />
        )}
        {step === 4 && (
          <StepDetails
            selectedCityId={selectedCityId}
            selectedCatId={selectedCatId}
            cities={cities}
            categories={cats}
            register={register}
            errors={errors}
            imagePreview={imagePreview}
            onImageSelect={onImageSelect}
            onImageRemove={onImageRemove}
          />
        )}

        {serverError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>{t("back")}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext() || isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-lift hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
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
      </form>

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
        onSubmitAction={async (name) => {
          const res = await createCategory(name);
          if (res.ok) handleCategoryCreated(res.data.id, name);
          return res;
        }}
      />
      <CreateModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={t("createService")}
        label={t("serviceName")}
        onSubmitAction={async (name, description) => {
          const res = await createService(name, description);
          if (res.ok) handleServiceCreated(res.data.id, name);
          return res;
        }}
      />
    </>
  );
}
