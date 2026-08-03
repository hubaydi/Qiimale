import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { StaggerGroup, StaggerItem } from "@/components/motion";
import { PlaceCard } from "@/components/PlaceCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getPayloadClient } from "@/lib/get-payload";
import { visibleContentQuery } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { Place } from "@/payload-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const so = locale === "so";
  const t = await getTranslations("Seo");

  return {
    title: t("categoriesTitle"),
    description: t("categoriesDescription"),
    alternates: {
      canonical: so ? "/categories" : "/en/categories",
      languages: {
        so: "/categories",
        en: "/en/categories",
      },
    },
  };
}

export default async function CategoriesPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();
  const user = await getCurrentUser();

  const categories = await payload.find({
    collection: "categories",
    where: visibleContentQuery(user),
    limit: 100,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const categoryPlaces = await Promise.all(
    categories.docs.map((cat) =>
      payload.find({
        collection: "places",
        where: {
          and: [
            visibleContentQuery(user),
            { "category.slug": { equals: cat.slug } },
          ],
        },
        limit: 8,
        sort: ["-ratingAvg", "-reviewCount"],
        overrideAccess: true,
        depth: 1,
        locale,
        fallbackLocale: "so",
      }),
    ),
  );

  const addLink = (
    <Link
      href="/categories/add-category"
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-lift hover:bg-primary/90"
    >
      <Plus size={16} />
      {t("Nav.addCategory")}
    </Link>
  );

  if (categories.docs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">{t("Categories.empty")}</p>
        <div className="flex justify-center">{addLink}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Categories.title")}
        </h1>
        {addLink}
      </div>
      {categories.docs.map((cat, i) => {
        const places = categoryPlaces[i].docs;
        return (
          <section key={cat.id}>
            <SectionHeader
              title={cat.name}
              href={`/categories/${cat.slug}`}
              linkLabel={t("Home.viewAll")}
              action={
                cat.status === "pending" ? (
                  <span className="rounded-full bg-rating/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-rating">
                    {locale === "so" ? "Tusaale" : "Preview"}
                  </span>
                ) : undefined
              }
            />
            {places.length > 0 ? (
              <StaggerGroup className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {places.map((p: Place) => (
                  <StaggerItem key={p.id}>
                    <PlaceCard place={p} locale={locale} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("Search.empty")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
