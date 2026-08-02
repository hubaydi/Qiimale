"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALE_LABELS = { so: "Soomaali", en: "English" } as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground cursor-pointer"
          aria-label="Language"
        >
          <Globe size={14} />
          {LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS]}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LOCALE_LABELS) as Array<keyof typeof LOCALE_LABELS>).map(
          (l) => (
            <DropdownMenuItem
              key={l}
              disabled={l === locale}
              onClick={() => router.replace(pathname, { locale: l })}
              className="justify-between"
            >
              {LOCALE_LABELS[l]}
              {l === locale ? <Check size={16} /> : null}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
