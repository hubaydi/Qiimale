"use client";

import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { registerUser } from "@/actions/auth";
import { PasswordInput } from "./PasswordInput";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const tErr = useTranslations("Errors");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const res = await registerUser({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      if (!res.ok) {
        setErr(
          res.error.message ||
            tErr(res.error.code as Parameters<typeof tErr>[0]),
        );
        return;
      }
      router.push(
        `/verify-email?email=${encodeURIComponent(String(fd.get("email") ?? ""))}`,
      );
    } catch {
      setErr(tErr("VALIDATION"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("register")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Abaabul akoon cusub si aad qiimayn u qortid
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="register-name"
              className="block text-sm font-semibold text-foreground"
            >
              {t("name")}
            </label>
            <input
              id="register-name"
              name="name"
              placeholder="Magacaaga buuxa"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-email"
              className="block text-sm font-semibold text-foreground"
            >
              {t("email")}
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="iimayl@tusaale.so"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-password"
              className="block text-sm font-semibold text-foreground"
            >
              {t("password")}
            </label>
            <PasswordInput
              id="register-password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
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
                <span>Diiwaan galinayaa...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>{t("register")}</span>
              </>
            )}
          </button>
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
