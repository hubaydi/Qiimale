"use client";

import { MessageSquare, Star } from "lucide-react";
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
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [sort, setSort] = useState<SortKey>("recent");

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;

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
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              tab.id === active.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-b pb-4">
        <MessageSquare size={20} className="text-primary" />
        <h2 className="text-xl font-bold">{active.label}</h2>
        <div className="flex items-center gap-2">
          <StarRating value={Math.round(active.rating)} size={16} />
          <span className="text-sm font-bold text-rating">
            {active.rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({active.count})
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs bg-muted p-1 rounded-lg border border-border">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-soft">
            <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
              {t("ratingBreakdown")}
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = active.distribution[5 - stars];
                const percentage = total > 0 ? (count / total) * 100 : 0;
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

        <div className="md:col-span-2">
          {active.reviews.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">{t("noReviews")}</p>
              <p className="text-sm">{t("noReviewsHint")}</p>
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
