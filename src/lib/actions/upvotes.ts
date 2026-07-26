"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { canUpvote } from "@/lib/reviews-logic";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Place, Review, ReviewUpvote } from "@/payload-types";

const schema = z.object({ reviewId: z.string() });

export async function toggleUpvote(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ upvoted: boolean }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return error("VALIDATION", "Invalid data");
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");

  const payload = await getPayloadClient();
  const review = (await payload.findByID({
    collection: "reviews",
    id: parsed.data.reviewId,
    overrideAccess: true,
  })) as Review | null;
  if (!review) return error("NOT_FOUND", "Review not found");

  const authorId =
    typeof review.author === "string" ? review.author : review.author?.id;
  if (!canUpvote(authorId, user.id)) {
    return error("SELF_UPVOTE", "You can't upvote your own review");
  }

  const placeId =
    typeof review.place === "string" ? review.place : review.place?.id;
  let placeSlug: string | undefined;
  if (placeId) {
    const place = (await payload.findByID({
      collection: "places",
      id: placeId,
      overrideAccess: true,
    })) as Place | null;
    placeSlug = place?.slug;
  }

  const existing = await payload.find({
    collection: "review-upvotes",
    where: {
      and: [{ review: { equals: review.id } }, { user: { equals: user.id } }],
    },
    limit: 1,
    overrideAccess: false,
    user,
  });
  if (existing.docs.length) {
    await payload.delete({
      collection: "review-upvotes",
      id: (existing.docs[0] as ReviewUpvote).id,
      overrideAccess: false,
      user,
    });
    if (placeSlug) revalidatePath(`/place/${placeSlug}`);
    return { ok: true, data: { upvoted: false } };
  }
  await payload.create({
    collection: "review-upvotes",
    data: { review: review.id, user: user.id },
    overrideAccess: false,
    user,
  });
  if (placeSlug) revalidatePath(`/place/${placeSlug}`);
  return { ok: true, data: { upvoted: true } };
}
