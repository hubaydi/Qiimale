import { ImageResponse } from "next/og";
import { getPayloadClient } from "@/lib/get-payload";
import { type MediaField, mediaUrl } from "@/lib/media";
import type { Category, City, Place } from "@/payload-types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return [
    {
      id: slug,
      size,
      contentType,
      alt: "Qiimale place page",
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  const payload = await getPayloadClient();

  const found = await payload.find({
    collection: "places",
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    depth: 1,
    locale: locale as "so" | "en",
    fallbackLocale: "so",
  });

  const place = found.docs[0] as Place | undefined;

  const name = place?.name ?? "Qiimale";
  const rating = place?.ratingAvg?.toFixed(1) ?? null;
  const reviewCount = place?.reviewCount ?? null;

  const category =
    typeof place?.category === "object" && place.category !== null
      ? (place.category as Category)
      : null;

  const city =
    typeof place?.city === "object" && place.city !== null
      ? (place.city as City)
      : null;

  const imageUrl = place?.image
    ? mediaUrl(place.image as MediaField, "card")
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: imageUrl
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${imageUrl})`
          : "linear-gradient(135deg, oklch(0.45 0.24 262) 0%, oklch(0.546 0.222 258) 45%, oklch(0.48 0.2 270) 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "system-ui, sans-serif",
        color: "white",
        padding: 64,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          marginBottom: 24,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>

      {rating && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          <span>★ {rating}</span>
          {reviewCount ? (
            <span style={{ opacity: 0.7 }}>({reviewCount} reviews)</span>
          ) : null}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 24,
          fontSize: 28,
          opacity: 0.8,
        }}
      >
        {category?.name && <span>{category.name}</span>}
        {city?.name && <span>{city.name}</span>}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 48,
          fontSize: 24,
          opacity: 0.5,
        }}
      >
        Qiimale
      </div>
    </div>,
    { ...size },
  );
}
