"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const next = locale === "so" ? "en" : "so";
    router.replace(pathname, { locale: next });
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
    >
      <Globe size={14} />
      {t("language")}
    </button>
  );
}
