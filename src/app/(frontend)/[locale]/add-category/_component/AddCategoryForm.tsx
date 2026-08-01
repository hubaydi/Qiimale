"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categorySchema = z.object({
  name: z.string().min(5).max(50),
  description: z.string().max(200).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function AddCategoryForm() {
  const t = useTranslations("AddCategory");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  function onSubmit(data: CategoryFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await createCategory(
        data.name,
        data.description || undefined,
      );
      if (!res.ok) {
        setServerError(tErr(res.error.code) || res.error.message);
        return;
      }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs"
    >
      <div className="space-y-2">
        <Label htmlFor="add-category-name">{t("name")}</Label>
        <Input
          id="add-category-name"
          placeholder={t("placeholder")}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs font-medium text-red-500">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-category-description">{t("description")}</Label>
        <Input id="add-category-description" {...register("description")} />
        {errors.description && (
          <p className="text-xs font-medium text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{t("submit")}</span>
          </>
        ) : (
          <span>{t("submit")}</span>
        )}
      </Button>
    </form>
  );
}
