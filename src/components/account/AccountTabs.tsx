"use client";

import {
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Tags,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category, City, Place, Review } from "@/payload-types";

const CARD =
  "rounded-xl border border-border bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all";
const TITLE =
  "font-bold text-foreground hover:text-primary transition-colors text-sm";

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "so" ? "so-SO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EmptyState({
  title,
  cta,
  href,
}: {
  title: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
      <p className="text-sm">{title}</p>
      <Link
        href={href}
        className="inline-block text-xs text-primary hover:underline font-medium"
      >
        {cta}
      </Link>
    </div>
  );
}

const STATUS_STYLES: Record<string, [typeof Clock, string]> = {
  pending: [Clock, "bg-amber-500/10 text-amber-600 dark:text-amber-400"],
  approved: [
    CheckCircle2,
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ],
  rejected: [XCircle, "bg-red-500/10 text-red-600 dark:text-red-400"],
  hidden: [Clock, "bg-amber-500/10 text-amber-600 dark:text-amber-400"],
  removed: [XCircle, "bg-red-500/10 text-red-600 dark:text-red-400"],
};

const statusKey = (s: string) =>
  `status${s.charAt(0).toUpperCase()}${s.slice(1)}`;

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Account");
  const style = STATUS_STYLES[status];
  if (!style) return null;
  const [Icon, className] = style;
  return (
    <Badge variant="secondary" className={className}>
      <Icon />
      {t(statusKey(status))}
    </Badge>
  );
}

type Item = {
  id: string;
  name: string;
  status: string;
  subtitle?: string;
  date?: string;
  href?: string;
};

function ItemCard({ item }: { item: Item }) {
  const locale = useLocale();
  return (
    <div className={`${CARD} flex items-center justify-between gap-3`}>
      <div>
        {item.href ? (
          <Link href={item.href} className={TITLE}>
            {item.name}
          </Link>
        ) : (
          <span className="font-bold text-sm text-foreground">{item.name}</span>
        )}
        {item.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {item.subtitle}
          </p>
        )}
        {item.date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(item.date, locale)}
          </p>
        )}
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

function ItemsList({
  items,
  emptyTitle,
  emptyCta,
  emptyHref,
}: {
  items: Item[];
  emptyTitle: string;
  emptyCta: string;
  emptyHref: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} cta={emptyCta} href={emptyHref} />;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function AccountTabs({
  reviews,
  places,
  categories,
  cities,
}: {
  reviews: Review[];
  places: Place[];
  categories: Category[];
  cities: City[];
}) {
  const t = useTranslations("Account");
  const locale = useLocale();

  const tabs = [
    ["reviews", t("myReviews"), MessageSquare, reviews.length],
    ["places", t("myPlaces"), Building2, places.length],
    ["categories", t("myCategories"), Tags, categories.length],
    ["cities", t("myCities"), MapPin, cities.length],
  ] as const;

  const placeItems = places.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    subtitle: p.address ?? undefined,
    date: p.createdAt,
    href: p.status === "approved" ? `/places/${p.slug}` : undefined,
  }));

  const categoryItems = categories.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    subtitle: c.description ?? undefined,
  }));

  const cityItems = cities.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
  }));

  const listTabs = [
    ["places", placeItems, t("noPlaces"), t("addPlace")],
    ["categories", categoryItems, t("noCategories"), t("addCategory")],
    ["cities", cityItems, t("noCities"), t("addCity")],
  ] as const;

  return (
    <Tabs defaultValue="reviews">
      <TabsList className="w-full justify-start overflow-x-auto">
        {tabs.map(([value, label, Icon, count]) => (
          <TabsTrigger key={value} value={value} className="flex-none">
            <Icon />
            {label}
            <CountBadge count={count} />
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="reviews" className="mt-4">
        {reviews.length === 0 ? (
          <EmptyState
            title={t("noReviews")}
            cta={t("findPlace")}
            href="/search"
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const place = typeof r.place === "object" ? r.place : null;
              return (
                <div key={r.id} className={`${CARD} space-y-2`}>
                  <div className="flex items-center justify-between gap-2">
                    {place ? (
                      <Link href={`/places/${place.slug}`} className={TITLE}>
                        {place.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-muted-foreground">
                        --
                      </span>
                    )}
                    <StarRating value={r.rating} size={14} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {r.text}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp size={13} className="text-primary" />
                      {t("upvotes", { count: r.upvoteCount || 0 })}
                    </span>
                    <span className="flex items-center gap-2">
                      {r.status !== "published" && (
                        <StatusBadge status={r.status} />
                      )}
                      <span>{formatDate(r.createdAt, locale)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {listTabs.map(([value, items, emptyTitle, emptyCta]) => (
        <TabsContent key={value} value={value} className="mt-4">
          <ItemsList
            items={items}
            emptyTitle={emptyTitle}
            emptyCta={emptyCta}
            emptyHref="/add-place"
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      {count}
    </span>
  );
}
