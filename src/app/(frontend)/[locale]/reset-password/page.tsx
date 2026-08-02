"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const resetSchema = z.object({
  password: z.string().min(8),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  });

  function onSubmit(data: ResetFormValues) {
    setServerError(null);
    startTransition(async () => {
      const { token } = await searchParams;
      if (!token) {
        setServerError(t("resetPasswordError"));
        return;
      }
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      if (res.ok) {
        router.push("/login?reset=true");
        return;
      }
      setServerError(t("resetPasswordError"));
    });
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h1 className="text-2xl font-extrabold text-center">
          {t("resetPassword")}
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <PasswordInput
              id="password"
              placeholder={t("password")}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle size={14} />
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                ...
              </>
            ) : (
              t("resetPassword")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
