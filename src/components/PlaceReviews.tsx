"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

const SORTS = ["recent", "top", "high", "low"] as const;
type SortKey = (typeof SORTS)[number];

type SortMeta = {
  id: string;
  rating: number;
  upvoteCount: number;
  createdAt: string;
};

export function PlaceReviews({
  reviews,
  cards,
  title,
  emptyTitle,
  emptyHint,
}: {
  reviews: SortMeta[];
  cards: ReactNode[];
  title: string;
  emptyTitle: string;
  emptyHint: string;
}) {
  const t = useTranslations("Review");
  const [sort, setSort] = useState<SortKey>("recent");

  const order = reviews
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

  return (
    <div className="md:col-span-2 space-y-6">
      <div className="flex flex-col items-start justify-between border-b pb-4 gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          <span>{title}</span>
        </h2>

        <div className="flex items-center gap-3 text-xs bg-muted p-1 rounded-lg border border-border">
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

      {reviews.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">{emptyTitle}</p>
          <p className="text-sm">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-4">{order.map(({ i }) => cards[i])}</div>
      )}
    </div>
  );
}
