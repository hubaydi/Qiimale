import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ReviewForm } from "@/components/ReviewForm";
import { getPayloadClient } from "@/lib/get-payload";
import { canViewOwnPending } from "@/lib/places-logic";
import { getCurrentUser } from "@/lib/session";
import type { Review } from "@/payload-types";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations();
  const payload = await getPayloadClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user._verified) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-border bg-card text-center space-y-4 shadow-soft">
        <h2 className="text-xl font-bold">{t("Auth.verifyEmail")}</h2>
        <p className="text-sm text-muted-foreground">{t("Auth.verifyEmail")}</p>
      </div>
    );
  }

  const place = (
    await payload.find({
      collection: "places",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];

  if (!place || !canViewOwnPending(place, user)) notFound();

  const existing = (
    await payload.find({
      collection: "reviews",
      where: {
        and: [{ place: { equals: place.id } }, { author: { equals: user.id } }],
      },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0] as Review | undefined;

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-jakarta tracking-tight">
          {existing ? t("Place.editReview") : t("Place.writeReview")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{place.name}</p>
      </div>
      <ReviewForm
        placeId={place.id}
        placeSlug={place.slug}
        existing={
          existing
            ? { rating: existing.rating, text: existing.text }
            : undefined
        }
      />
    </div>
  );
}
