"use client";

import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { uploadMedia } from "@/actions/media";
import { submitReview } from "@/actions/reviews";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "@/lib/review-draft";
import type { ActionResult } from "@/lib/types";

async function uploadPhoto(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res: ActionResult<{ id: string }> = await uploadMedia(fd);
  return res.ok ? res.data.id : null;
}

function StarRow({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <StarRating value={value} size={24} onChange={onSelect} />
    </div>
  );
}

export function ReviewForm({
  placeId,
  placeSlug,
  services,
  existing,
}: {
  placeId: string;
  placeSlug: string;
  services: { id: string; name: string }[];
  existing: { serviceId: string | null; rating: number; text: string }[];
}) {
  const t = useTranslations("Review");
  const locale = useLocale();
  const router = useRouter();

  const existingMap = new Map(
    existing.map((e) => [e.serviceId ?? "general", e]),
  );

  const [target, setTarget] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const draft = loadReviewDraft(window.sessionStorage, placeId);
    if (draft) {
      setTarget(draft.serviceId ?? "general");
      setRating(draft.rating);
      setText(draft.text);
    }
  }, [placeId]);

  function ratingFor(id: string): number {
    if (target === id) return rating;
    return existingMap.get(id)?.rating ?? 0;
  }

  function select(id: string, v: number) {
    setTarget(id);
    setRating(v);
    setText(existingMap.get(id)?.text ?? "");
    setServerError(null);
  }

  const currentName =
    target === "general"
      ? t("overall")
      : (services.find((s) => s.id === target)?.name ?? "");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function onSubmit() {
    if (target === null || rating < 1) return;
    if (text.trim().length < 3) {
      setServerError(t("minLength"));
      return;
    }
    setServerError(null);
    startTransition(async () => {
      const photoIds: string[] = [];
      for (const f of files) {
        const id = await uploadPhoto(f);
        if (id) photoIds.push(id);
      }
      const res = await submitReview({
        placeId,
        rating,
        text,
        photoIds,
        serviceId: target === "general" ? undefined : target,
      });
      if (!res.ok) {
        if (res.error.code === "UNAUTHENTICATED") {
          saveReviewDraft(window.sessionStorage, placeId, {
            rating,
            text,
            serviceId: target === "general" ? null : target,
          });
          router.push(
            `/login?redirect=${encodeURIComponent(`/${locale}/places/${placeSlug}`)}`,
          );
          return;
        }
        setServerError(res.error.message);
        return;
      }
      clearReviewDraft(window.sessionStorage, placeId);
      router.push(`/places/${placeSlug}`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6 max-w-xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-soft"
    >
      <div className="space-y-3">
        <StarRow
          label={t("overall")}
          value={ratingFor("general")}
          onSelect={(v) => select("general", v)}
        />
        {services.map((s) => (
          <StarRow
            key={s.id}
            label={s.name}
            value={ratingFor(s.id)}
            onSelect={(v) => select(s.id, v)}
          />
        ))}
      </div>

      {target === null ? (
        <p className="text-sm text-muted-foreground">{t("pickTarget")}</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-primary">
            {target === "general"
              ? t("overallPrompt", { stars: rating })
              : t("servicePrompt", { stars: rating, service: currentName })}
          </p>

          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("commentPlaceholder")}
              rows={5}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-y"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("minLength")}</span>
              <span>{text.length} / 3+</span>
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
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-input hover:border-primary hover:bg-primary/5 cursor-pointer transition-all text-center p-2">
                  <Upload size={20} className="text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("addPhoto")}
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
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t("submitting")}</span>
                </>
              ) : (
                <span>{t("submit")}</span>
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
