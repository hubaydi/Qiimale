"use client";

import { AlertCircle, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function CreateModal({
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
  const t = useTranslations("AddPlace");
  const tErr = useTranslations("Errors");
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
