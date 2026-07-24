"use client";

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
      className="text-muted-foreground hover:text-foreground"
    >
      {t("language")}
    </button>
  );
}
