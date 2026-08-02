import { Plus } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { StaggerGroup, StaggerItem } from "@/components/motion";
import { getPayloadClient } from "@/lib/get-payload";
import type { Category } from "@/payload-types";

export default async function CategoriesPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const categories = await payload.find({
    collection: "categories",
    where: { status: { equals: "approved" } },
    limit: 100,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

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
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" />
          {t("Categories.title")}
        </h1>
        {addLink}
      </div>
      <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.docs.map((cat: Category) => (
          <StaggerItem key={cat.id}>
            <Link
              href={`/categories/${cat.slug}`}
              className="group flex h-full flex-col justify-center gap-1.5 rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/30 min-h-26"
            >
              <span className="text-sm font-medium text-foreground leading-tight">
                {cat.name}
              </span>
              {cat.description ? (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {cat.description}
                </span>
              ) : null}
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
