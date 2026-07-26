"use client";

import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { submitReview } from "@/lib/actions/reviews";
import type { ActionResult } from "@/lib/types";
import { StarRating } from "./StarRating";

async function uploadPhoto(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/media", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!res.ok) return null;
  const doc = await res.json();
  return doc?.doc?.id ?? doc?.id ?? null;
}

export function ReviewForm({
  placeId,
  placeSlug,
  existing,
}: {
  placeId: string;
  placeSlug: string;
  existing?: { rating: number; text: string };
}) {
  const t = useTranslations("Review");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selectedFiles);

    // Create preview URLs
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (rating < 1) {
      setErr(`${t("rating")} waa qasab.`);
      return;
    }
    if (text.trim().length < 20) {
      setErr(t("minLength"));
      return;
    }

    start(async () => {
      const photoIds: string[] = [];
      for (const f of files) {
        const id = await uploadPhoto(f);
        if (id) photoIds.push(id);
      }

      const res: ActionResult<{ reviewId: string }> = await submitReview({
        placeId,
        rating,
        text,
        photoIds,
      });

      if (!res.ok) {
        setErr(res.error.message);
        return;
      }

      router.push(`/place/${placeSlug}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 max-w-xl bg-white border border-border rounded-2xl p-6 sm:p-8"
    >
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-foreground">
          {t("rating")}
        </span>
        <div className="flex items-center gap-3">
          <StarRating value={rating} size={32} onChange={setRating} />
          {rating > 0 && (
            <span className="text-sm font-bold text-amber-500">{rating}/5</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-semibold text-foreground"
          htmlFor="text"
        >
          {t("comment")}
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("commentPlaceholder")}
          rows={5}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("minLength")}</span>
          <span>{text.length} / 20+</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-foreground">
          {t("photos")}
        </span>
        <div className="grid grid-cols-3 gap-3">
          {previews.map((src, i) => (
            <div
              key={src}
              className="relative aspect-square rounded-xl overflow-hidden border group"
            >
              {/* biome-ignore lint/performance/noImgElement: local object url preview */}
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {files.length < 3 && (
            <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all text-center p-2">
              <Upload size={20} className="text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground font-medium">
                Ku dar sawir
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Deynayaa...</span>
            </>
          ) : (
            <span>{t("submit")}</span>
          )}
        </button>
      </div>
    </form>
  );
}
