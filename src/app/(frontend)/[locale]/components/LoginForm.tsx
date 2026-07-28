"use client";

import { AlertCircle, Loader2, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { loginUser, logoutUser } from "@/lib/actions/auth";

export function LoginForm({ existingUser }: { existingUser?: boolean }) {
  const t = useTranslations("Auth");
  const tErr = useTranslations("Errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogout() {
    await logoutUser();
    router.refresh();
  }

  if (existingUser) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 max-w-sm mx-auto text-center space-y-4">
        <p className="text-sm text-muted-foreground font-medium">
          Waad ku dhex jirtaa akoonkaaga
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-semibold hover:bg-destructive/90 transition-all shadow-xs cursor-pointer"
        >
          <LogOut size={16} />
          <span>{t("logout") || "Ka bax"}</span>
        </button>
      </div>
    );
  }

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
        setErr(res.error.message || tErr(res.error.code as Parameters<typeof tErr>[0]));
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
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
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

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <span className="relative bg-card px-3 text-xs font-medium text-muted-foreground uppercase">
            Ama
          </span>
        </div>

        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-muted/50 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>{t("google")}</span>
        </a>

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
