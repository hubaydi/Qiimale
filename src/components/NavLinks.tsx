"use client";

import {
  Building2,
  LayoutGrid,
  LogIn,
  MapPin,
  Search,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddMenu } from "@/components/AddMenu";
import type { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  labels: Record<
    | "search"
    | "categories"
    | "cities"
    | "places"
    | "account"
    | "login"
    | "admin",
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
      <AddMenu className={ctaClassName} />
      {user?.role === "admin" && (
        <Link
          href="/admin"
          className={cn(
            "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname.startsWith("/admin")
              ? "bg-blue-50 text-blue-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            linkClassName,
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              pathname.startsWith("/admin")
                ? "bg-blue-100 text-blue-600"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Shield size={16} />
          </span>
          {labels.admin}
        </Link>
      )}
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
