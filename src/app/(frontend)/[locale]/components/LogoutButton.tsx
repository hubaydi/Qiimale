"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { logoutUser } from "@/lib/actions/auth";

export function LogoutButton() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    await logoutUser();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-destructive text-white px-3 py-1.5 text-xs font-semibold hover:bg-destructive/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
    >
      <LogOut size={14} />
      <span>{t("logout") || "Ka bax"}</span>
    </button>
  );
}
