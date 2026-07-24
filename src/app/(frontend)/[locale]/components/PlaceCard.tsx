import * as Icons from "lucide-react";
import Link from "next/link";
import { StarRating } from "./StarRating";

export function PlaceCard({ place, locale }: { place: any; locale: string }) {
  const category = typeof place.category === "object" ? place.category : null;
  const city = typeof place.city === "object" ? place.city : null;
  const Icon = category?.icon ? (Icons as any)[category.icon] : Icons.MapPin;
  return (
    <Link
      href={`/place/${place.slug}`}
      className="block rounded-lg border p-4 hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{place.name}</div>
          <div className="text-sm text-muted-foreground">
            {category?.name?.[locale] ?? category?.name} ·{" "}
            {city?.name?.[locale] ?? city?.name}
          </div>
        </div>
        {Icon ? (
          <Icon size={18} className="text-muted-foreground shrink-0" />
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <StarRating value={Math.round(place.ratingAvg || 0)} />
        <span className="text-muted-foreground">{place.reviewCount || 0}</span>
      </div>
    </Link>
  );
}
