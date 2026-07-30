import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { getCurrentUser } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header() {
  const t = await getTranslations("Nav");
  const user = await getCurrentUser();

  const labels = {
    search: t("search"),
    categories: t("categories"),
    cities: t("cities"),
    places: t("places"),
    addPlace: t("addPlace"),
    account: t("account"),
    login: t("login"),
  };

  return (
    <header className="sticky top-0 z-50 h-16 backdrop-blur-sm bg-[oklch(0.975_0.002_250)]/80 border-b border-[oklch(0.922_0.005_250)]/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="font-jakarta text-xl font-bold text-foreground"
        >
          Qiimale
        </Link>

        <nav className="hidden md:flex items-center gap-2 text-sm">
          <NavLinks labels={labels} user={user} />
          <LanguageSwitcher />
        </nav>

        <MobileNav menuLabel={t("menu")}>
          <NavLinks
            labels={labels}
            user={user}
            linkClassName="w-full text-base py-2.5 px-4"
            ctaClassName="w-full justify-center my-1"
          />
          <LanguageSwitcher />
        </MobileNav>
      </div>
    </header>
  );
}
