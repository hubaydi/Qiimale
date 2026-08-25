"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ServiceOption } from "./types";
import { getLocalizedName } from "./utils";

export function StepServicesSelect({
  services,
  selectedIds,
  onToggle,
  onCreate,
}: {
  services: ServiceOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
}) {
  const t = useTranslations("AddPlace");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <span className="block text-sm font-semibold text-foreground">
        {t("selectServices")}
      </span>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noServices")}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {services.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <label
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-input bg-card px-4 py-3 cursor-pointer hover:border-primary transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(s.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">
                  {getLocalizedName(s.name, locale)}
                  {s.status === "pending" ? ` (${t("pendingSuffix")})` : ""}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
      >
        <Plus size={16} />
        <span>{t("createService")}</span>
      </button>
    </div>
  );
}
