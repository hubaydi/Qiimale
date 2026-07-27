import { LayoutGrid, LogIn, MapPin, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import type { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  labels: Record<
    "search" | "categories" | "cities" | "addPlace" | "account" | "login",
    string
  >;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  linkClassName?: string;
  ctaClassName?: string;
}

export function NavLinks({
  labels,
  user,
  linkClassName,
  ctaClassName,
}: NavLinksProps) {
  return (
    <>
      <Link
        href="/search"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
          linkClassName,
        )}
      >
        <Search size={16} />
        {labels.search}
      </Link>
      <Link
        href="/categories"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
          linkClassName,
        )}
      >
        <LayoutGrid size={16} />
        {labels.categories}
      </Link>
      <Link
        href="/cities"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
          linkClassName,
        )}
      >
        <MapPin size={16} />
        {labels.cities}
      </Link>
      <Link
        href="/add-place"
        className={cn(
          "inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          ctaClassName,
        )}
      >
        <Plus size={16} />
        {labels.addPlace}
      </Link>
      {user ? (
        <Link
          href="/account"
          className={cn(
            "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
            linkClassName,
          )}
        >
          <User size={16} />
          {labels.account}
        </Link>
      ) : (
        <Link
          href="/login"
          className={cn(
            "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
            linkClassName,
          )}
        >
          <LogIn size={16} />
          {labels.login}
        </Link>
      )}
    </>
  );
}
