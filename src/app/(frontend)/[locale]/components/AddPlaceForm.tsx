"use client";

import { AlertCircle, Building2, Loader2, MapPin, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { addPlace } from "@/lib/actions/places";

interface CategoryOption {
  id: string;
  name: string | { so?: string; en?: string };
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
  const [pending, start] = useTransition();
  const [cats, setCats] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories?limit=100").then((r) => r.json()),
      fetch("/api/cities?limit=100").then((r) => r.json()),
    ])
      .then(([c, ci]) => {
        setCats(c.docs || []);
        setCities(ci.docs || []);
      })
      .catch(() => {
        setErr("Failed to load categories or cities");
      });
  }, []);

  function getLocalizedName(
    name: string | { so?: string; en?: string },
  ): string {
    if (typeof name === "string") return name;
    if (!name) return "";
    return (locale === "en" ? name.en : name.so) || name.so || name.en || "";
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    start(async () => {
      const res = await addPlace({
        name: String(fd.get("name") || ""),
        categoryId: String(fd.get("category") || ""),
        cityId: String(fd.get("city") || ""),
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

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
    >
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="category"
            className="block text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Tag size={15} className="text-primary" />
            <span>{t("category")} *</span>
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          >
            <option value="">-- Doorasho --</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {getLocalizedName(c.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="city"
            className="block text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Building2 size={15} className="text-primary" />
            <span>{t("city")} *</span>
          </label>
          <select
            id="city"
            name="city"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          >
            <option value="">-- Doorasho --</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {getLocalizedName(c.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="address"
          className="block text-sm font-semibold text-foreground flex items-center gap-1.5"
        >
          <MapPin size={15} className="text-primary" />
          <span>{t("address")}</span>
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

      {err && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Deynayaa...</span>
            </>
          ) : (
            <span>{t("submit")}</span>
          )}
        </button>
      </div>
    </form>
  );
}
