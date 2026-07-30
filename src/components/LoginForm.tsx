"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginUser } from "@/actions/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  showVerified,
  showReset,
}: {
  showVerified?: boolean;
  showReset?: boolean;
}) {
  const t = useTranslations("Auth");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await loginUser(data);
      if (!res.ok) {
        setServerError(tErr(res.error.code) || res.error.message);

        return;
      }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("login")}
          </h1>
          <p className="text-sm text-muted-foreground">Ku soo dhowaw Qiimale</p>
        </div>

        {showVerified && (
          <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 text-center flex items-center justify-center gap-1">
            <CheckCircle2 size={16} />
            {t("verifiedSuccess")}
          </div>
        )}
        {showReset && (
          <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 text-center flex items-center justify-center gap-1">
            <CheckCircle2 size={16} />
            {t("passwordResetSuccess")}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("email")}</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="iimayl@tusaale.so"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">{t("password")}</Label>
            <PasswordInput
              id="login-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-medium text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{serverError}</span>
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
                <span>Loading...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>{t("login")}</span>
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/register"
            className="text-primary hover:underline font-semibold"
          >
            {t("noAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
