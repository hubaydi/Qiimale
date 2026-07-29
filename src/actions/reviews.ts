"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { canPublishReview, hasExistingReview } from "@/lib/reviews-logic";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Place, Review } from "@/payload-types";

const schema = z.object({
  placeId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20),
  photoIds: z.array(z.string()).max(3).optional(),
});

export async function submitReview(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ reviewId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }

  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");
  if (!canPublishReview(user)) return error("UNVERIFIED", "Verify email first");

  const payload = await getPayloadClient();
  const place = (await payload.findByID({
    collection: "places",
    id: parsed.data.placeId,
    overrideAccess: true,
    user,
  })) as Place | null;
  if (!place || place.status !== "approved") {
    return error("NOT_FOUND", "Place not found");
  }

  const existing = await payload.find({
    collection: "reviews",
    where: {
      and: [
        { place: { equals: parsed.data.placeId } },
        { author: { equals: user.id } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    user,
  });

  const data = {
    rating: parsed.data.rating,
    text: parsed.data.text,
    status: "published" as const,
    author: user.id,
    place: parsed.data.placeId,
    photos: (parsed.data.photoIds || []).map((id) => ({ image: id })),
  };

  let reviewId: string;
  if (hasExistingReview(existing.docs as Review[], user.id)) {
    const updated = (await payload.update({
      collection: "reviews",
      id: (existing.docs[0] as Review).id,
      data,
      overrideAccess: true,
      user,
    })) as Review;
    reviewId = updated.id;
  } else {
    const created = (await payload.create({
      collection: "reviews",
      data,
      overrideAccess: true,
      user,
    })) as Review;
    reviewId = created.id;
  }

  revalidatePath(`/place/${place.slug}`);
  return { ok: true, data: { reviewId } };
}
