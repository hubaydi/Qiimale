"use client";

import { ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleUpvote } from "@/actions/upvotes";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function UpvoteButton({
  reviewId,
  count,
  upvoted,
  authenticated,
}: {
  reviewId: string;
  count: number;
  upvoted: boolean;
  authenticated: boolean;
}) {
  const t = useTranslations("Review");
  const tAuth = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [localCount, setLocalCount] = useState(count);
  const [localUpvoted, setLocalUpvoted] = useState(upvoted);

  function handleClick() {
    if (!authenticated) {
      toast(t("loginToUpvote"), {
        action: {
          label: tAuth("login"),
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    const prevUpvoted = localUpvoted;
    const prevCount = localCount;
    const nextUpvoted = !prevUpvoted;
    setLocalUpvoted(nextUpvoted);
    setLocalCount(prevCount + (nextUpvoted ? 1 : -1));

    start(async () => {
      const res = await toggleUpvote({ reviewId });
      if (!res.ok) {
        setLocalUpvoted(prevUpvoted);
        setLocalCount(prevCount);
        toast.error(tErrors(res.error.code));
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 text-sm transition-colors hover:text-primary cursor-pointer disabled:opacity-50",
        localUpvoted ? "text-primary font-medium" : "text-muted-foreground",
      )}
      aria-label={t("upvote")}
      aria-pressed={localUpvoted}
    >
      <ThumbsUp size={16} />
      <span>{localCount}</span>
    </button>
  );
}
