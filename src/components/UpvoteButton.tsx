"use client";

import { ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toggleUpvote } from "@/actions/upvotes";
import { cn } from "@/lib/utils";

export function UpvoteButton({
  reviewId,
  count,
  upvoted,
}: {
  reviewId: string;
  count: number;
  upvoted: boolean;
}) {
  const t = useTranslations("Review");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleUpvote({ reviewId });
          router.refresh();
        })
      }
      className={cn(
        "inline-flex items-center gap-1 text-sm transition-colors hover:text-blue-600 cursor-pointer disabled:opacity-50",
        upvoted ? "text-blue-600 font-medium" : "text-muted-foreground",
      )}
      aria-label={t("upvote")}
    >
      <ThumbsUp size={16} />
      <span>{count}</span>
    </button>
  );
}
