"use client";

import { AlertCircle, CheckCircle2, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { loginUser } from "@/lib/actions/auth";
import { PasswordInput } from "./PasswordInput";

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
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const res = await loginUser({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setPending(false);
    if (!res.ok) {
      try {
        setErr(
          res.error.message ||
            tErr(res.error.code as Parameters<typeof tErr>[0]),
        );
      } catch {
        setErr(res.error.message);
      }
      return;
    }
    router.push("/account");
    router.refresh();
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-foreground"
            >
              {t("email")}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="iimayl@tusaale.so"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-foreground"
            >
              {t("password")}
            </label>
            <PasswordInput
              id="login-password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {err && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Gelineysa...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>{t("login")}</span>
              </>
            )}
          </button>
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
