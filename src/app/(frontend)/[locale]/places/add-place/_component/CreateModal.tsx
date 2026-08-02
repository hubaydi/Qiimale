"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().max(200).optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export function CreateModal({
  open,
  onClose,
  title,
  label,
  onSubmitAction,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  onSubmitAction: (
    name: string,
    description?: string,
  ) => Promise<
    | { ok: true; data: { id: string } }
    | { ok: false; error: { code: string; message: string } }
  >;
}) {
  const t = useTranslations("AddPlace");
  const tErr = useTranslations("Errors");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  if (!open) return null;

  async function onSubmit(data: CreateFormValues) {
    setModalError(null);
    setIsPending(true);
    const res = await onSubmitAction(
      data.name.trim(),
      data.description?.trim(),
    );
    setIsPending(false);
    if (!res.ok) {
      setModalError(tErr(res.error.code) || res.error.message);

      return;
    }
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-float ring-1 ring-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">{label}</Label>
            <Input id="create-name" placeholder={label} {...register("name")} />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-description">{t("description")}</Label>
            <Input
              id="create-description"
              placeholder={t("description")}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {modalError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-lift hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("create")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
