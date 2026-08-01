import { getTranslations } from "next-intl/server";
import { FlagButton } from "@/components/FlagButton";
import { StarRating } from "@/components/StarRating";
import { UpvoteButton } from "@/components/UpvoteButton";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import type { Media, Review } from "@/payload-types";

export async function ReviewCard({
  review,
  locale,
}: {
  review: Review;
  locale: string;
}) {
  const t = await getTranslations("Review");
  const payload = await getPayloadClient();
  const user = await getCurrentUser();

  const author = typeof review.author === "object" ? review.author : null;

  let upvoted = false;
  if (user) {
    const found = await payload.find({
      collection: "review-upvotes",
      where: {
        and: [{ review: { equals: review.id } }, { user: { equals: user.id } }],
      },
      limit: 1,
      overrideAccess: true,
    });
    upvoted = found.docs.length > 0;
  }

  let flagged = false;
  if (user) {
    const f = await payload.find({
      collection: "flags",
      where: {
        and: [
          { review: { equals: review.id } },
          { reporter: { equals: user.id } },
          { status: { equals: "open" } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    flagged = f.docs.length > 0;
  }

  return (
    <article className="border border-border bg-white rounded-xl p-6 text-card-foreground space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
            {author?.name ? author.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="font-semibold text-sm">
              {author?.name || t("by", { name: "Macaamiil" })}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString(
                locale === "so" ? "so-SO" : "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              )}
            </div>
          </div>
        </div>
        <StarRating value={review.rating} size={16} />
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        {review.text}
      </p>

      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {review.photos.map((p) => {
            const img = typeof p.image === "object" ? (p.image as Media) : null;
            const url = img?.url || img?.filename;
            if (!url) return null;
            return (
              <a
                key={p.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative block h-20 w-20 overflow-hidden rounded-lg ring-1 ring-border bg-muted"
              >
                {/* biome-ignore lint/performance/noImgElement: media upload preview */}
                <img
                  src={url}
                  alt={img?.alt || "Review photo"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4">
          <UpvoteButton
            reviewId={review.id}
            count={review.upvoteCount || 0}
            upvoted={upvoted}
            authenticated={!!user}
          />
          {user && <FlagButton reviewId={review.id} flagged={flagged} />}
        </div>
      </div>
    </article>
  );
}
