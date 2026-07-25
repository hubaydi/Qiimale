"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { flagReview } from "@/lib/actions/flags";

export function FlagButton({
  reviewId,
  flagged,
}: {
  reviewId: string;
  flagged: boolean;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const reasons: Array<"fake" | "offensive" | "spam" | "coi" | "other"> = [
    "fake",
    "offensive",
    "spam",
    "coi",
    "other",
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (flagged) {
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Flag size={14} className="fill-current text-amber-500" />
        {t("Review.flagged")}
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors"
        aria-label={t("Review.flag")}
      >
        <Flag size={14} />
        {t("Review.flag")}
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-10 rounded border bg-popover text-popover-foreground p-1 text-xs shadow-md min-w-[120px]">
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await flagReview({ reviewId, reason: r });
                  if (res.ok) {
                    setOpen(false);
                  } else {
                    alert(res.error.message);
                  }
                })
              }
              className="block w-full px-2 py-1.5 text-left hover:bg-muted rounded transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t(`Flag.${r}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
