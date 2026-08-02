import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { getCurrentUser } from "@/lib/session";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

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
    admin: t("admin"),
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl backdrop-saturate-150 shadow-soft supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        <Link href="/" className="transition-colors hover:opacity-80">
          <Logo />
        </Link>

        <nav className="hidden lg:flex items-center gap-2 text-sm">
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
