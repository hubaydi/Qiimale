"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCity } from "@/actions/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const citySchema = z.object({
  name: z.string().min(5).max(50),
});

type CityFormValues = z.infer<typeof citySchema>;

export function AddCityForm() {
  const t = useTranslations("AddCity");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    defaultValues: { name: "" },
  });

  function onSubmit(data: CityFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await createCity(data.name);
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
        <Label htmlFor="add-city-name">{t("name")}</Label>
        <Input
          id="add-city-name"
          placeholder={t("placeholder")}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs font-medium text-destructive">
            {errors.name.message}
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
