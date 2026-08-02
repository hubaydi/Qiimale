import {
  Building2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  ThumbsUp,
  User as UserIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { AccountTabs } from "@/components/account/AccountTabs";
import { LogoutButton } from "@/components/LogoutButton";
import { ResendButton } from "@/components/ResendButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import type { Category, City, Place, Review } from "@/payload-types";

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "so" ? "so-SO" : "en-US", {
    year: "numeric",
    month: "long",
  });
}

export default async function AccountPage() {
  const t = await getTranslations("Account");
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const payload = await getPayloadClient();

  const [reviews, places, categories, cities] = await Promise.all([
    payload.find({
      collection: "reviews",
      where: { author: { equals: user.id } },
      overrideAccess: true,
      depth: 1,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "places",
      where: { submittedBy: { equals: user.id } },
      overrideAccess: true,
      depth: 1,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "categories",
      where: { submittedBy: { equals: user.id } },
      overrideAccess: true,
      depth: 1,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "cities",
      where: { submittedBy: { equals: user.id } },
      overrideAccess: true,
      depth: 1,
      sort: "-createdAt",
    }),
  ]);

  const reviewDocs = reviews.docs as Review[];
  const placeDocs = places.docs as Place[];
  const categoryDocs = categories.docs as Category[];
  const cityDocs = cities.docs as City[];

  const totalUpvotes = reviewDocs.reduce(
    (sum, r) => sum + (r.upvoteCount || 0),
    0,
  );
  const avgRating =
    reviewDocs.length > 0
      ? reviewDocs.reduce((sum, r) => sum + r.rating, 0) / reviewDocs.length
      : null;
  const approvedPlaces = placeDocs.filter(
    (p) => p.status === "approved",
  ).length;
  const pendingPlaces = placeDocs.filter((p) => p.status === "pending").length;

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Profile header with cover */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="h-28 sm:h-32 bg-linear-to-r from-primary to-primary/70" />
        <div className="px-6 pb-6 max-sm:-mt-10 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-primary/15 font-bold text-2xl text-primary shrink-0 shadow-soft">
              {user.name ? initials : <UserIcon size={32} />}
            </div>
            <div className="flex-1 pt-4 sm:pt-0">
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 flex-wrap">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
                {user._verified ? (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 />
                    {t("verified")}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-rating/10 text-rating"
                  >
                    <Clock />
                    {t("unverified")}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {t("memberSince", {
                    date: formatDate(user.createdAt, locale),
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pb-1">
              {!user._verified && <ResendButton email={user.email} />}
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <MessageSquare className="text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-none">
                {reviewDocs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("statReviews")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <ThumbsUp className="text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-none">
                {totalUpvotes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("statUpvotes")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <Star className="text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-none">
                {avgRating === null ? t("noAvg") : avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("statAvgRating")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <Building2 className="text-primary" />
            <div>
              <p className="text-2xl font-extrabold leading-none">
                {placeDocs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("statPlaces")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("placesSplit", {
                  approved: approvedPlaces,
                  pending: pendingPlaces,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AccountTabs
        reviews={reviewDocs}
        places={placeDocs}
        categories={categoryDocs}
        cities={cityDocs}
      />
    </div>
  );
}
