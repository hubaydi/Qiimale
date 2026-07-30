import * as Icons from "lucide-react";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import type { Category, City, Place } from "@/payload-types";

export function PlaceCard({
  place,
  locale,
}: {
  place: Place;
  locale?: string;
}) {
  const _currentLocale = locale;
  const category =
    typeof place.category === "object" && place.category !== null
      ? (place.category as Category)
      : null;
  const city =
    typeof place.city === "object" && place.city !== null
      ? (place.city as City)
      : null;
  const iconName = category?.icon as keyof typeof Icons | undefined;
  // biome-ignore lint/performance/noDynamicNamespaceImportAccess: lucide icon lookup
  const iconComponent = iconName ? Icons[iconName] : null;
  const Icon =
    (iconComponent as React.ComponentType<{
      size?: number;
      className?: string;
    }>) || Icons.MapPin;
  return (
    <Link
      href={`/place/${place.slug}`}
      className="group block border border-border bg-white rounded-xl p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-sm hover:border-l-2 hover:border-l-blue-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-foreground leading-snug group-hover:text-blue-600">
            {place.name}
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {category?.name}
            {city?.name ? ` · ${city.name}` : null}
          </div>
        </div>
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
        <StarRating value={Math.round(place.ratingAvg || 0)} />
        <span className="text-muted-foreground">{place.reviewCount || 0}</span>
      </div>
    </Link>
  );
}
