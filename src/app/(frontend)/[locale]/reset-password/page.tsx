"use client";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { token } = await searchParams;
    if (!token) {
      setErr(t("resetPasswordError"));
      setPending(false);
      return;
    }
    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: fd.get("password") }),
    });
    setPending(false);
    if (res.ok) {
      router.push("/login?reset=true");
      return;
    }
    setErr(t("resetPasswordError"));
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <h1 className="text-2xl font-extrabold text-center">
          {t("resetPassword")}
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordInput
            name="password"
            placeholder={t("password")}
            required
            minLength={8}
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
              t("resetPassword")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
