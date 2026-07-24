import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Qiimale
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/search">{t("search")}</Link>
          <Link href="/add-place">{t("addPlace")}</Link>
          {user ? (
            <Link href="/account">{t("account")}</Link>
          ) : (
            <Link href="/login">{t("login")}</Link>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
