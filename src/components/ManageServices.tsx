"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  addServiceToPlace,
  createServiceForPlace,
  removeServiceFromPlace,
} from "@/actions/services";

export function ManageServices({
  placeId,
  attached,
  isAdmin,
  available,
}: {
  placeId: string;
  attached: { id: string; name: string }[];
  isAdmin: boolean;
  available: { id: string; name: string }[];
}) {
  const t = useTranslations("Place");
  const router = useRouter();
  const [name, setName] = useState("");
  const [attachId, setAttachId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function create() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createServiceForPlace({ placeId, name: name.trim() });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setName("");
      router.refresh();
    });
  }

  function attach() {
    if (!attachId) return;
    setError(null);
    startTransition(async () => {
      const res = await addServiceToPlace({ placeId, serviceId: attachId });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setAttachId("");
      router.refresh();
    });
  }

  function remove(serviceId: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeServiceFromPlace({ placeId, serviceId });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plus size={16} aria-hidden />
        </span>
        <div>
          <h3 className="font-jakarta text-sm font-semibold text-foreground">
            {t("addService")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("addServiceHint")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("servicePlaceholder")}
          className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={create}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          <span>{t("addService")}</span>
        </button>
      </div>

      {isAdmin && available.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={attachId}
            onChange={(e) => setAttachId(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">{t("attachService")}</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={attach}
            disabled={!attachId || isPending}
            aria-label={t("attachService")}
            className="inline-flex items-center justify-center rounded-lg border border-input px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
      )}

      {isAdmin && attached.length > 0 && (
        <ul className="space-y-1">
          {attached.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between text-sm text-muted-foreground"
            >
              <span>{s.name}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`${t("remove")} ${s.name}`}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
