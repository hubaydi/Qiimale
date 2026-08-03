import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s — Qiimale`,
      default: "Qiimale",
    },
    description: so
      ? "Qiimayn goobo & adeegyo Soomaaliya"
      : "Review Somali places & services",
    alternates: {
      canonical: so ? "/" : "/en",
      languages: { so: "/", en: "/en" },
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: "Qiimale",
      locale: so ? "so_SO" : "en_US",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
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
      <body className="min-h-full flex flex-col font-inter">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
