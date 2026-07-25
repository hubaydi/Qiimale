import {
  Building2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import type { Place, Review } from "@/payload-types";
import { StarRating } from "../components/StarRating";

export default async function AccountPage() {
  const t = await getTranslations("Account");
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const payload = await getPayloadClient();

  const reviews = await payload.find({
    collection: "reviews",
    where: { author: { equals: user.id } },
    overrideAccess: false,
    user,
    depth: 1,
    sort: "-createdAt",
  });

  const places = await payload.find({
    collection: "places",
    where: { submittedBy: { equals: user.id } },
    overrideAccess: false,
    user,
    depth: 1,
    sort: "-createdAt",
  });

  const reviewDocs = reviews.docs as Review[];
  const placeDocs = places.docs as Place[];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Profile Header */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
          {user.name ? (
            user.name.slice(0, 2).toUpperCase()
          ) : (
            <UserIcon size={32} />
          )}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground capitalize">
              {user.role}
            </span>
            {user._verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>{locale === "so" ? "La xaqiijiyay" : "Verified"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} />
                <span>
                  {locale === "so" ? "Aan la xaqiijin" : "Unverified"}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Reviews */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            <span>{t("myReviews")}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">
              {reviewDocs.length}
            </span>
          </h2>

          {reviewDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground space-y-2">
              <p className="text-sm">
                {locale === "so"
                  ? "Weli qiimayn ma samayn."
                  : "No reviews submitted yet."}
              </p>
              <Link
                href="/search"
                className="inline-block text-xs text-primary hover:underline font-medium"
              >
                {locale === "so"
                  ? "Raadi goob si aad u qiamayso"
                  : "Find a place to review"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewDocs.map((r) => {
                const place =
                  typeof r.place === "object" ? (r.place as Place) : null;
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border bg-card p-4 space-y-2 hover:border-primary/50 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      {place ? (
                        <Link
                          href={`/place/${place.slug}`}
                          className="font-bold text-foreground hover:text-primary transition-colors text-sm"
                        >
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
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Submitted Places */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 size={20} className="text-primary" />
            <span>{t("myPlaces")}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">
              {placeDocs.length}
            </span>
          </h2>

          {placeDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground space-y-2">
              <p className="text-sm">
                {locale === "so"
                  ? "Weli goob ma soo gudbin."
                  : "No places added yet."}
              </p>
              <Link
                href="/add-place"
                className="inline-block text-xs text-primary hover:underline font-medium"
              >
                {locale === "so" ? "Ku dar goob cusub" : "Add a new place"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {placeDocs.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border bg-card p-4 flex items-center justify-between hover:border-primary/50 transition-colors shadow-2xs"
                >
                  <div>
                    {p.status === "approved" ? (
                      <Link
                        href={`/place/${p.slug}`}
                        className="font-bold text-foreground hover:text-primary transition-colors text-sm"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-foreground">
                        {p.name}
                      </span>
                    )}
                    {p.address && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.address}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                      p.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {p.status === "pending" ? (
                      <>
                        <Clock size={12} />
                        <span>{t("statusPending")}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        <span>{t("statusApproved")}</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
