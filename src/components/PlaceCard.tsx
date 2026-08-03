import { ExternalLink, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import { type MediaField, mediaUrl } from "@/lib/media";
import type { Place } from "@/payload-types";

export function PlaceCard({
  place,
  locale,
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
      className="group relative flex min-w-0 items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift hover:border-primary/40"
    >
      {place.status === "pending" && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-rating/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-rating">
          {locale === "so" ? "Tusaale" : "Preview"}
        </span>
      )}
      {imageUrl ? (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(min-width: 640px) 112px, 96px"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.06]"
          />
        </div>
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-muted to-muted/40 text-muted-foreground/40 sm:h-28 sm:w-28">
          <Tag size={22} aria-hidden />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 break-words font-semibold text-foreground leading-snug transition-colors group-hover:text-primary">
          {place.name}
        </div>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {category?.name}
          {city?.name ? ` · ${city.name}` : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/70 pt-3 text-sm">
          <StarRating value={Math.round(place.ratingAvg || 0)} />
          <span className="text-muted-foreground">
            {place.reviewCount || 0}
          </span>
          {website && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
              <ExternalLink size={12} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
