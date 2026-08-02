"use client";

import { Building2, ChevronDown, MapPin, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/places/add-place", key: "addPlace", icon: Building2 },
  { href: "/categories/add-category", key: "addCategory", icon: Tag },
  { href: "/cities/add-city", key: "addCity", icon: MapPin },
] as const;

export function AddMenu({ className }: { className?: string }) {
  const t = useTranslations("Nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift hover:bg-primary/90 cursor-pointer",
            className,
          )}
        >
          <Plus size={16} />
          {t("add")}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {ITEMS.map(({ href, key, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon size={16} />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
