"use client";

import { MessageSquare, Star } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";

const SORTS = ["recent", "top", "high", "low"] as const;
type SortKey = (typeof SORTS)[number];

export type ReviewsTab = {
  id: string;
  label: string;
  rating: number;
  count: number;
  distribution: [number, number, number, number, number];
  reviews: {
    id: string;
    rating: number;
    upvoteCount: number;
    createdAt: string;
  }[];
  cards: ReactNode[];
};

export function ServiceReviewTabs({ tabs }: { tabs: ReviewsTab[] }) {
  const t = useTranslations("Review");
  const tPlace = useTranslations("Place");
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [sort, setSort] = useState<SortKey>("recent");

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;

  function scrollToReviewForm() {
    document.getElementById("write-review")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  const order = active.reviews
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const byRecent =
        a.r.createdAt < b.r.createdAt
          ? 1
          : a.r.createdAt > b.r.createdAt
            ? -1
            : 0;
      switch (sort) {
        case "top":
          return (b.r.upvoteCount || 0) - (a.r.upvoteCount || 0) || byRecent;
        case "high":
          return b.r.rating - a.r.rating || byRecent;
        case "low":
          return a.r.rating - b.r.rating || byRecent;
        default:
          return byRecent;
      }
    });

  const total = active.distribution.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Sticky service tabs + active tab header */}
      <div className="sticky top-20 z-30 space-y-3 rounded-2xl border border-border/80 bg-background/90 p-2.5 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        {/* Tab pills */}
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label={tPlace("reviews", { count: active.count })}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === active.id}
              onClick={() => setActiveId(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                tab.id === active.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Active tab header */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare size={18} aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {active.label}
              </h2>
              <div className="mt-0.5 flex items-center gap-2">
                <StarRating value={Math.round(active.rating)} size={14} />
                <span className="text-sm font-bold text-rating">
                  {active.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tPlace("reviews", { count: active.count })}
                </span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-muted p-1">
            {SORTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  sort === s
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(
                  `sort${s[0].toUpperCase()}${s.slice(1)}` as
                    | "sortRecent"
                    | "sortTop"
                    | "sortHigh"
                    | "sortLow",
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Rating summary */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft md:sticky md:top-24">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-jakarta text-4xl font-bold leading-none text-foreground">
                    {active.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {tPlace("reviews", { count: active.count })}
                </p>
              </div>
              <StarRating value={Math.round(active.rating)} size={18} />
            </div>

            <div className="mt-5 space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = active.distribution[5 - stars];
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      {stars}
                    </span>
                    <Star
                      size={12}
                      className="shrink-0 fill-rating text-rating"
                      aria-hidden
                    />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-rating transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Review list */}
        <div className="md:col-span-2">
          {active.reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MessageSquare size={22} aria-hidden />
              </span>
              <p className="mt-4 font-semibold text-foreground">
                {t("noReviews")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("noReviewsHint")}
              </p>
              <button
                type="button"
                onClick={scrollToReviewForm}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 cursor-pointer"
              >
                {tPlace("writeReview")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {order.map(({ i }) => active.cards[i])}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
