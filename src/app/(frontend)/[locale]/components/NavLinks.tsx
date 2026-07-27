import { Plus } from "lucide-react";
import Link from "next/link";
import type { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  labels: Record<
    "search" | "categories" | "addPlace" | "account" | "login",
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
          "font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
          linkClassName,
        )}
      >
        {labels.search}
      </Link>
      <Link
        href="/categories"
        className={cn(
          "font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
          linkClassName,
        )}
      >
        {labels.categories}
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
            "font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
            linkClassName,
          )}
        >
          {labels.account}
        </Link>
      ) : (
        <Link
          href="/login"
          className={cn(
            "font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors",
            linkClassName,
          )}
        >
          {labels.login}
        </Link>
      )}
    </>
  );
}
