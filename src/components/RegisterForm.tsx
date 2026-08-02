"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerUser } from "@/actions/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    name: z.string().min(5),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const t = useTranslations("Auth");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: RegisterFormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (!res.ok) {
        setServerError(tErr(res.error.code) || res.error.message);

        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    });
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("register")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sameyso akoon cusub si aad qiimayn u qortid
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-name">{t("name")}</Label>
            <Input
              id="register-name"
              placeholder="Magacaaga buuxa"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">{t("email")}</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="iimayl@tusaale.so"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">{t("password")}</Label>
            <PasswordInput
              id="register-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">
              {t("confirmPassword")}
            </Label>
            <PasswordInput
              id="register-confirm-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
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
                <UserPlus size={16} />
                <span>{t("register")}</span>
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            {t("haveAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
