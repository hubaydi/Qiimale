"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALE_LABELS = {
  so: "Soomaali",
  en: "English",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative inline-flex items-center">
      <Globe
        size={14}
        className="absolute left-2.5 text-muted-foreground pointer-events-none"
      />
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        className="appearance-none bg-muted text-muted-foreground hover:text-foreground rounded-lg pl-7 pr-4 py-1.5 text-sm font-medium transition-colors cursor-pointer border-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="so">{LOCALE_LABELS.so}</option>
        <option value="en">{LOCALE_LABELS.en}</option>
      </select>
    </div>
  );
}
