import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "./components/Header";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Qiimale",
    description: "Qiimayn goobo & adeegyo Soomaaliya",
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <footer className="bg-slate-900 text-white">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                  <span className="font-[family-name:var(--font-jakarta)] text-xl font-bold">
                    Qiimale
                  </span>
                  <p className="mt-2 text-sm text-slate-400">
                    {locale === "so"
                      ? "Qiimayn goobo & adeegyo Soomaaliya"
                      : "Rate places & services in Somalia"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Quick links
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    <li>
                      <a
                        href="/search"
                        className="hover:text-white transition-colors"
                      >
                        Search
                      </a>
                    </li>
                    <li>
                      <a
                        href="/add-place"
                        className="hover:text-white transition-colors"
                      >
                        Add a place
                      </a>
                    </li>
                    <li>
                      <a
                        href="/categories"
                        className="hover:text-white transition-colors"
                      >
                        Categories
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">About</h3>
                  <p className="mt-3 text-sm text-slate-400">
                    {locale === "so"
                      ? "Qiimale waa goob loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada Soomaaliya."
                      : "Qiimale is a platform for reviewing places and services in Somalia."}
                  </p>
                </div>
              </div>
              <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
                Qiimale © {new Date().getFullYear()} · Made in Somalia
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
