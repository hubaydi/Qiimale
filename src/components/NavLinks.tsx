"use client";

import {
  Building2,
  LayoutGrid,
  LogIn,
  MapPin,
  Plus,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  labels: Record<
    | "search"
    | "categories"
    | "cities"
    | "places"
    | "addPlace"
    | "account"
    | "login",
    string
  >;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  linkClassName?: string;
  ctaClassName?: string;
}

const LINKS = [
  { key: "search" as const, href: "/search", icon: Search },
  { key: "categories" as const, href: "/categories", icon: LayoutGrid },
  { key: "cities" as const, href: "/cities", icon: MapPin },
  { key: "places" as const, href: "/places", icon: Building2 },
];

export function NavLinks({
  labels,
  user,
  linkClassName,
  ctaClassName,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ key, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-blue-50 text-blue-600"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              linkClassName,
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-blue-100 text-blue-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon size={16} />
            </span>
            {labels[key]}
          </Link>
        );
      })}
      <Link
        href="/add-place"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 my-2",
          ctaClassName,
        )}
      >
        <Plus size={16} />
        {labels.addPlace}
      </Link>
      <div className="my-1 border-t border-border" />
      {user ? (
        <Link
          href="/account"
          className={cn(
            "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/account"
              ? "bg-blue-50 text-blue-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            linkClassName,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User size={16} />
          </span>
          {labels.account}
        </Link>
      ) : (
        <Link
          href="/login"
          className={cn(
            "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/login"
              ? "bg-blue-50 text-blue-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            linkClassName,
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <LogIn size={16} />
          </span>
          {labels.login}
        </Link>
      )}
    </>
  );
}
