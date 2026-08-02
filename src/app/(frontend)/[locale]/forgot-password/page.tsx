"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotSchema = z.object({
  email: z.email(),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(data: ForgotFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (res.ok) {
        setSent(true);
        return;
      }
      setServerError(t("resetPasswordError"));
    });
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-card text-center space-y-4 shadow-soft">
        <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
        <h1 className="text-xl font-bold">{t("forgotPasswordSent")}</h1>
        <Link
          href="/login"
          className="text-primary hover:underline font-semibold text-sm"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-1">
          <Mail className="mx-auto text-primary" size={32} />
          <h1 className="text-2xl font-extrabold">
            {t("forgotPasswordTitle")}
          </h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("email")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">
                {errors.email.message}
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
              t("forgotPasswordTitle")
            )}
          </Button>
        </form>
        <p className="text-center text-xs">
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
