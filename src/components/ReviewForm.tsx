"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitReview } from "@/actions/reviews";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types";

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

const reviewSchema = z.object({
  rating: z.number().int().min(1),
  text: z.string().min(20),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existing?.rating ?? 0,
      text: existing?.text ?? "",
    },
  });

  const rating = watch("rating");
  const text = watch("text");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selectedFiles);

    // Create preview URLs
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit(data: ReviewFormValues) {
    setServerError(null);
    startTransition(async () => {
      const photoIds: string[] = [];
      for (const f of files) {
        const id = await uploadPhoto(f);
        if (id) photoIds.push(id);
      }
      const res: ActionResult<{ reviewId: string }> = await submitReview({
        placeId,
        rating: data.rating,
        text: data.text,
        photoIds,
      });
      if (!res.ok) {
        setServerError(res.error.message);
        return;
      }
      router.push(`/places/${placeSlug}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-soft"
    >
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-foreground">
          {t("rating")}
        </span>
        <div className="flex items-center gap-3">
          <input
            type="hidden"
            {...register("rating", { valueAsNumber: true })}
          />
          <StarRating
            value={rating}
            size={32}
            onChange={(v) => setValue("rating", v, { shouldValidate: true })}
          />
          {rating > 0 && (
            <span className="text-sm font-bold text-rating">{rating}/5</span>
          )}
        </div>
        {errors.rating && (
          <p className="text-xs font-medium text-destructive">
            {errors.rating.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">{t("comment")}</Label>
        <textarea
          id="text"
          {...register("text")}
          placeholder={t("commentPlaceholder")}
          rows={5}
          className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("minLength")}</span>
          <span>{text.length} / 20+</span>
        </div>
        {errors.text && (
          <p className="text-xs font-medium text-destructive">
            {errors.text.message}
          </p>
        )}
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
            <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-input hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-center p-2">
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

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="pt-2">
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>{t("submit")}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
