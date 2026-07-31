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
  const imageUrl = mediaUrl(place?.image as MediaField, "card");
  const imageAlt =
    typeof place.image === "object" && place.image
      ? (place.image.alt ?? place.name)
      : place.name;
  const website = place.website || null;

  return (
    <Link
      href={`/places/${place.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-sm hover:border-l-2 hover:border-l-blue-500"
    >
      {imageUrl ? (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-4/3 w-full bg-linear-to-br from-muted to-muted/40" />
      )}

      <div className="p-4">
        <div className="min-w-0">
          <div className="font-semibold text-foreground leading-snug group-hover:text-blue-600">
            {place.name}
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {category?.name}
            {city?.name ? ` · ${city.name}` : null}
          </div>
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
