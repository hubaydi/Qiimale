import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 h-16 backdrop-blur-sm bg-[oklch(0.975_0.002_250)]/80 border-b border-[oklch(0.922_0.005_250)]/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-foreground"
        >
          Qiimale
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/search"
            className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
          >
            {t("search")}
          </Link>
          <Link
            href="/add-place"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {t("addPlace")}
          </Link>
          {user ? (
            <Link
              href="/account"
              className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
            >
              {t("account")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
            >
              {t("login")}
            </Link>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
