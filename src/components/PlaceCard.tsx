import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import { type MediaField, mediaUrl } from "@/lib/media";
import type { Place } from "@/payload-types";

export function PlaceCard({
  place,
  locale: _locale,
}: {
  place: Place;
  locale?: string;
}) {
  const category =
    typeof place.category === "object" && place.category !== null
      ? place.category
      : null;
  const city =
    typeof place.city === "object" && place.city !== null ? place.city : null;
  const imageUrl = mediaUrl(place?.image as MediaField, "thumb");
  const imageAlt =
    typeof place.image === "object" && place.image
      ? (place.image.alt ?? place.name)
      : place.name;
  const website = place.website || null;

  return (
    <Link
      href={`/places/${place.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-sm hover:border-l-2 hover:border-l-blue-500"
    >
      {imageUrl ? (
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-28 w-28 shrink-0 rounded-lg bg-linear-to-br from-muted to-muted/40" />
      )}

      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground leading-snug group-hover:text-blue-600">
          {place.name}
        </div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {category?.name}
          {city?.name ? ` · ${city.name}` : null}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
          <StarRating value={Math.round(place.ratingAvg || 0)} />
          <span className="text-muted-foreground">
            {place.reviewCount || 0}
          </span>
          {website && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600">
              <ExternalLink size={12} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
