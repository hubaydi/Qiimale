import * as Icons from "lucide-react";
import Link from "next/link";
import type { Category, City, Place } from "@/payload-types";
import { StarRating } from "./StarRating";

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
      className="group block rounded-xl border bg-card p-5 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-snug group-hover:text-primary">
            {place.name}
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {category?.name}
            {city?.name ? ` · ${city.name}` : null}
          </div>
        </div>
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon size={18} className="text-muted-foreground" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
        <StarRating value={Math.round(place.ratingAvg || 0)} />
        <span className="text-muted-foreground">
          {place.reviewCount || 0}
        </span>
      </div>
    </Link>
  );
}
