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
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { createCategory } from "@/actions/categories";
import { createCity } from "@/actions/cities";
import { addPlace } from "@/actions/places";

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

    async function handleModalSubmit() {
      setModalErr(null);
      if (!name.trim()) {
        setModalErr(label);
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
            res.error.message ||
              tErr(res.error.code as Parameters<typeof tErr>[0]),
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
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
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
            <label
              htmlFor="create-name"
              className="block text-sm font-semibold text-foreground"
            >
              {label}
            </label>
            <input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          {showIcon && (
            <div className="space-y-2">
              <label
                htmlFor="create-icon"
                className="block text-sm font-semibold text-foreground"
              >
                {t("categoryIcon")}
              </label>
              <input
                id="create-icon"
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
              type="button"
              onClick={handleModalSubmit}
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
        </div>
      </div>
    );
  }

  // ---- Step content renderers ----
  function renderStep1() {
    return (
      <div className="space-y-4">
        <label
          htmlFor="city-select"
          className="block text-sm font-semibold text-foreground"
        >
          {t("selectCity")}
        </label>
        <select
          id="city-select"
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
        <label
          htmlFor="category-select"
          className="block text-sm font-semibold text-foreground"
        >
          {t("selectCategory")}
        </label>
        <select
          id="category-select"
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
