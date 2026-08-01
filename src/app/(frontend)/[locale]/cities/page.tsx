import * as Icons from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
import type { City } from "@/payload-types";

export default async function CitiesPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as "so" | "en";
  const payload = await getPayloadClient();

  const cities = await payload.find({
    collection: "cities",
    where: { status: { equals: "approved" } },
    limit: 100,
    locale,
    fallbackLocale: "so",
    overrideAccess: true,
  });

  const addLink = (
    <Link
      href="/add-city"
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <Icons.Plus size={16} />
      {t("Nav.addCity")}
    </Link>
  );

  if (cities.docs.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-muted-foreground mb-6">{t("Cities.empty")}</p>
        <div className="flex justify-center">{addLink}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />
          {t("Cities.title")}
        </h1>
        {addLink}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cities.docs.map((city: City) => (
          <Link
            key={city.id}
            href={`/cities/${city.slug}`}
            className="group flex flex-col items-center gap-2.5 border border-border bg-white rounded-xl p-5 text-center transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Icons.MapPin size={20} />
            </div>
            <span className="text-sm font-medium text-foreground leading-tight">
              {city.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
