import {
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
  PenLine,
  Store,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AboutQiimale } from "@/components/AboutQiimale";
import { JsonLd } from "@/components/json-ld";
import { ManageServices } from "@/components/ManageServices";
import { Reveal } from "@/components/motion";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import {
  type ReviewsTab,
  ServiceReviewTabs,
} from "@/components/ServiceReviewTabs";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { getPayloadClient } from "@/lib/get-payload";
import { type MediaField, mediaAlt, mediaUrl } from "@/lib/media";
import { placeMetadata } from "@/lib/place-meta";
import { canViewOwnPending } from "@/lib/places-logic";
import { computeStats } from "@/lib/reviews-logic";
import { canViewService, reviewIsVisible } from "@/lib/services-logic";
import { getCurrentUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site-url";
import { normalizeUrl } from "@/lib/url";
import type { Place, Review, Service } from "@/payload-types";

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

/** Circular rating gauge — the page's signature stat, rendered with pure SVG. */
function RatingRing({
  value,
  size = 104,
  stroke = 9,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.min(Math.max(value, 0), 5);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 5);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`${clamped.toFixed(1)} / 5`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--rating)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-jakarta text-3xl font-bold leading-none text-foreground">
          {clamped.toFixed(1)}
        </span>
        <span className="mt-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          / 5
        </span>
      </div>
    </div>
  );
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Place");
  const tNav = await getTranslations("Nav");
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
  const imageUrl = mediaUrl(place.image as MediaField);
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

  const reviewDocs = reviews.docs.filter((r) => reviewIsVisible(r, user));

  const services = ((place.services ?? []) as (string | Service)[])
    .filter(
      (s) => typeof s === "object" && s !== null && canViewService(s, user),
    )
    .map((s) => s as Service);

  const availableServices =
    user?.role === "admin"
      ? (
          (
            await payload.find({
              collection: "services",
              where: { status: { equals: "approved" } },
              limit: 500,
              overrideAccess: true,
            })
          ).docs as Service[]
        )
          .filter((s) => !services.some((v) => v.id === s.id))
          .map((s) => ({ id: s.id, name: s.name }))
      : [];

  const existingReviews = user
    ? (
        (
          await payload.find({
            collection: "reviews",
            where: {
              and: [
                { place: { equals: place.id } },
                { author: { equals: user.id } },
              ],
            },
            limit: 100,
            overrideAccess: true,
            depth: 0,
          })
        ).docs as Review[]
      ).map((r) => ({
        serviceId: typeof r.service === "string" ? r.service : null,
        rating: r.rating,
        text: r.text,
      }))
    : [];

  function distributionOf(
    list: Review[],
  ): [number, number, number, number, number] {
    const d = [0, 0, 0, 0, 0];
    for (const r of list) {
      if (r.rating >= 1 && r.rating <= 5) d[5 - r.rating]++;
    }
    return d as [number, number, number, number, number];
  }

  function toTab(id: string, label: string, list: Review[]): ReviewsTab {
    const stats = computeStats(list.map((r) => r.rating));
    return {
      id,
      label,
      rating: stats.avg,
      count: list.length,
      distribution: distributionOf(list),
      reviews: list.map((r) => ({
        id: r.id,
        rating: r.rating,
        upvoteCount: r.upvoteCount || 0,
        createdAt: r.createdAt,
      })),
      cards: list.map((r) => (
        <ReviewCard key={r.id} review={r} locale={locale} />
      )),
    };
  }

  const generalTab = toTab(
    "general",
    t("overall"),
    reviewDocs.filter((r) => !r.service),
  );
  const serviceTabs = services.map((s) =>
    toTab(
      s.id,
      s.name,
      reviewDocs.filter((r) => {
        const sid = typeof r.service === "string" ? r.service : r.service?.id;
        return sid === s.id;
      }),
    ),
  );
  const tabs = [generalTab, ...serviceTabs];
  const totalReviews = place.reviewCount || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          {tNav("home")}
        </Link>
        <ChevronRight
          size={14}
          className="text-muted-foreground/50"
          aria-hidden
        />
        <Link
          href="/search"
          className="transition-colors hover:text-foreground"
        >
          {tNav("search")}
        </Link>
        <ChevronRight
          size={14}
          className="text-muted-foreground/50"
          aria-hidden
        />
        <span className="max-w-52 truncate font-medium text-foreground sm:max-w-xs">
          {place.name}
        </span>
      </nav>

      {/* Hero card */}
      <Reveal
        as="div"
        className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lift"
      >
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="min-w-0 flex-1 space-y-5">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {imageUrl ? (
                  <div className="relative size-50 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-soft">
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      priority
                      sizes="200px"
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex size-50 shrink-0 items-center justify-center rounded-2xl border border-border bg-linear-to-br from-muted to-muted/40">
                    <Store
                      size={40}
                      strokeWidth={1.25}
                      className="text-muted-foreground/30"
                      aria-hidden
                    />
                  </div>
                )}

                <div className="min-w-0 space-y-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Store size={13} aria-hidden />
                      {category?.name || "Qayb"}
                    </span>
                    <h1 className="mt-3 font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      {place.name}
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {t("reviewIntro", { name: place.name })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          size={15}
                          className="text-primary"
                          aria-hidden
                        />
                        <span className="font-medium text-foreground/80">
                          {city.name}
                        </span>
                      </span>
                    )}
                    {place.address && (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-1 rounded-full bg-border"
                          aria-hidden
                        />
                        <span>{place.address}</span>
                      </span>
                    )}
                  </div>

                  {website && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-fit"
                    >
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink aria-hidden />
                        {t("visitWebsite")}
                      </a>
                    </Button>
                  )}

                  {place.description && (
                    <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                      {place.description}
                    </p>
                  )}
                </div>
              </div>

              {services.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    {t("services")}
                  </h3>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {services.map((s) => (
                      <li
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                      >
                        <span
                          className="size-1.5 rounded-full bg-primary"
                          aria-hidden
                        />
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="shrink-0 lg:w-64">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-6 text-center">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {t("rating")}
                </span>
                <RatingRing value={place.ratingAvg || 0} />
                <div className="flex flex-col items-center gap-1">
                  <StarRating
                    value={Math.round(place.ratingAvg || 0)}
                    size={16}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t("reviews", { count: totalReviews })}
                  </span>
                </div>
                <a
                  href="#write-review"
                  className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <PenLine size={15} aria-hidden />
                  {t("writeReview")}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </Reveal>

      {place.status === "pending" && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden
          />
          <p>{t("pending")}</p>
        </div>
      )}

      {user && (
        <ManageServices
          placeId={place.id}
          attached={services.map((s) => ({ id: s.id, name: s.name }))}
          isAdmin={user.role === "admin"}
          available={availableServices}
        />
      )}

      <section id="write-review" className="scroll-mt-24 space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PenLine size={20} aria-hidden />
          </span>
          <div>
            <h2 className="font-jakarta text-xl font-bold tracking-tight text-foreground">
              {t("writeReview")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("writeReviewHint")}
            </p>
          </div>
        </div>
        <ReviewForm
          placeId={place.id}
          placeSlug={place.slug}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          existing={existingReviews}
        />
      </section>

      <ServiceReviewTabs tabs={tabs} />

      {/* About Qiimale */}
      <AboutQiimale compact />

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
