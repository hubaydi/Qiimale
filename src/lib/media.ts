import type { Media } from "@/payload-types";

export type MediaField = string | Media | null | undefined;

export function mediaUrl(
  media: MediaField,
  size?: "thumb" | "card",
): string | null {
  if (!media || typeof media === "string") return null;
  if (size && media.sizes?.[size]?.url) return media.sizes[size]?.url;
  return media.url ?? null;
}

export function mediaAlt(media: MediaField, fallback = ""): string {
  if (!media || typeof media === "string") return fallback;
  return media.alt ?? fallback;
}
