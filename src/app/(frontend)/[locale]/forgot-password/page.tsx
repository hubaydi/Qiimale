"use client";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email");
    const res = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setPending(false);
    if (res.ok) {
      setSent(true);
      return;
    }
    setErr(t("resetPasswordError"));
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-border bg-white text-center space-y-4">
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
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder={t("email")}
            required
            className="w-full rounded-lg border px-4 py-3"
          />
          {err && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle size={14} />
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                ...
              </>
            ) : (
              t("forgotPasswordTitle")
            )}
          </button>
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
