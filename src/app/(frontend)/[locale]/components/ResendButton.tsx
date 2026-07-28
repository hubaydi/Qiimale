"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";

export function ResendButton({ email }: { email: string }) {
  const t = useTranslations("Auth");
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setSent(false);
    await resendVerificationEmail(email);
    setSent(true);
    setCooldown(60);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        className="text-primary hover:underline font-semibold text-sm disabled:opacity-50 disabled:no-underline cursor-pointer"
      >
        {cooldown > 0 ? t("resendCooldown", { seconds: cooldown }) : t("resendVerification")}
      </button>
      {sent && <p className="text-xs text-emerald-600">{t("resendSuccess")}</p>}
    </div>
  );
}
