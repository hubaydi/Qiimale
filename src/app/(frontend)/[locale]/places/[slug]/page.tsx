import { ArrowLeft, ExternalLink, MapPin, Plus, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/motion";
import { PlaceReviews } from "@/components/PlaceReviews";
import { ReviewCard } from "@/components/ReviewCard";
import { StarRating } from "@/components/StarRating";
import { getPayloadClient } from "@/lib/get-payload";
import { type MediaField, mediaAlt, mediaUrl } from "@/lib/media";
import { placeMetadata } from "@/lib/place-meta";
import { canViewOwnPending } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site-url";
import { normalizeUrl } from "@/lib/url";
import type { Place } from "@/payload-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "places",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale: locale as "so" | "en",
    fallbackLocale: "so",
  });

  const place = found.docs[0] as Place | undefined;
  if (!place || place.status !== "approved") return {};

  return placeMetadata(place, locale as "so" | "en");
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Place");
  const locale = await getLocale();

  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "places",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale: locale as "so" | "en",
    fallbackLocale: "so",
  });

  const place = found.docs[0] as Place | undefined;
  const user = await getCurrentUser();
  if (!place || !canViewOwnPending(place, user)) notFound();

  const category = typeof place.category === "object" ? place.category : null;
  const city = typeof place.city === "object" ? place.city : null;
  const imageUrl = mediaUrl(place.image as MediaField, "card");
  const imageAlt = mediaAlt(place.image as MediaField, place.name);
  const website = place.website ? normalizeUrl(place.website) : null;

  const reviews = await payload.find({
    collection: "reviews",
    where: {
      and: [
        { place: { equals: place.id } },
        { status: { equals: "published" } },
      ],
    },
    limit: 50,
    sort: "-createdAt",
    overrideAccess: true,
    depth: 2,
  });

  const reviewDocs = reviews.docs;

  // Calculate rating distribution for visual details
  const ratingDistribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
  for (const r of reviewDocs) {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[5 - r.rating]++;
    }
  }
  const totalReviews = place.reviewCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          <span>
            {locale === "so" ? "Ku laabo raadinta" : "Back to search"}
          </span>
        </Link>
      </div>

      {/* Main Info Card */}
      <Reveal
        as="div"
        className="rounded-2xl border border-border bg-card text-card-foreground overflow-hidden shadow-soft"
      >
        {imageUrl ? (
          <div className="relative aspect-video w-full bg-muted md:aspect-2/1">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="relative p-6 sm:p-8">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {category?.name || "Qayb"}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-2">
                  {place.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
                {city && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-primary" />
                    <span>{city.name}</span>
                  </div>
                )}
                {place.address && (
                  <div className="flex items-center gap-1 border-l pl-4 border-border">
                    <span>{place.address}</span>
                  </div>
                )}
              </div>

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors w-fit"
                >
                  <ExternalLink size={15} />
                  {(() => {
                    try {
                      return new URL(website).hostname.replace(/^www\./, "");
                    } catch {
                      return website;
                    }
                  })()}
                </a>
              )}

              {place.description && (
                <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed pt-2">
                  {place.description}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-border/50 min-w-37.5 shrink-0 text-center">
              <span className="text-4xl font-black text-foreground">
                {place.ratingAvg?.toFixed(1) ?? "0.0"}
              </span>
              <div className="my-2">
                <StarRating
                  value={Math.round(place.ratingAvg || 0)}
                  size={18}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {t("reviews", { count: totalReviews })}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex flex-wrap gap-4 items-center justify-between">
            <Link
              href={`/places/${slug}/review`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all shadow-soft hover:shadow-lift hover:bg-primary/90 cursor-pointer"
            >
              <Plus size={16} />
              {t("writeReview")}
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Reviews Breakdown and List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rating distribution sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-soft">
            <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
              {locale === "so" ? "Qiimaynta" : "Rating breakdown"}
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[5 - stars];
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right">{stars}</span>
                    <Star
                      size={12}
                      className="fill-rating text-rating shrink-0"
                    />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rating rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <PlaceReviews
          reviews={reviewDocs.map((r) => ({
            id: r.id,
            rating: r.rating,
            upvoteCount: r.upvoteCount || 0,
            createdAt: r.createdAt,
          }))}
          cards={reviewDocs.map((r) => (
            <ReviewCard key={r.id} review={r} locale={locale} />
          ))}
          title={locale === "so" ? "Faallooyin" : "Reviews"}
          emptyTitle={t("noReviews")}
          emptyHint={t("noReviewsHint")}
        />
      </div>

      {/* JSON-LD Structured Data */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: place.name,
          description: place.description || undefined,
          ...(imageUrl ? { image: `${SITE_URL}${imageUrl}` } : {}),
          ...(city
            ? {
                address: {
                  "@type": "PostalAddress",
                  addressLocality: city.name,
                  ...(place.address ? { streetAddress: place.address } : {}),
                },
              }
            : {}),
          url: `${SITE_URL}/places/${place.slug}`,
          ...(totalReviews > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: place.ratingAvg?.toFixed(1) ?? "0",
                  reviewCount: totalReviews,
                },
              }
            : {}),
        }}
      />
      {reviewDocs.slice(0, 10).map((r) => {
        let authorName = "Anonymous";
        if (typeof r.author === "object" && r.author !== null) {
          const u = r.author as { name?: string };
          if (u.name) authorName = u.name;
        }
        return (
          <JsonLd
            key={r.id}
            data={{
              "@context": "https://schema.org",
              "@type": "Review",
              itemReviewed: {
                "@type": "LocalBusiness",
                name: place.name,
              },
              author: { "@type": "Person", name: authorName },
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating.toString(),
              },
              datePublished: r.createdAt,
            }}
          />
        );
      })}
    </div>
  );
}
