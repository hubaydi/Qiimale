"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPayloadClient } from "@/lib/get-payload";
import { getCurrentUser } from "@/lib/session";
import { type ActionResult, error } from "@/lib/types";
import type { Flag, Review } from "@/payload-types";

const schema = z.object({
  reviewId: z.string(),
  reason: z.enum(["fake", "offensive", "spam", "coi", "other"]),
  note: z.string().max(500).optional(),
});

export async function flagReview(
  input: z.infer<typeof schema> & Record<string, unknown>,
): Promise<ActionResult<{ flagId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return error(
      "VALIDATION",
      parsed.error.issues[0]?.message || "Invalid data",
    );
  }
  const user = await getCurrentUser();
  if (!user) return error("UNAUTHENTICATED", "Login required");

  const payload = await getPayloadClient();
  const review = (await payload.findByID({
    collection: "reviews",
    id: parsed.data.reviewId,
    overrideAccess: true,
    user,
  })) as Review | null;
  if (!review) return error("NOT_FOUND", "Review not found");

  const placeId =
    typeof review.place === "string" ? review.place : review.place?.id;
  let placeSlug: string | undefined;
  if (placeId) {
    const place = (await payload.findByID({
      collection: "places",
      id: placeId,
      overrideAccess: true,
      user,
    })) as { slug?: string } | null;
    placeSlug = place?.slug;
  }

  const open = await payload.find({
    collection: "flags",
    where: {
      and: [
        { review: { equals: review.id } },
        { reporter: { equals: user.id } },
        { status: { equals: "open" } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });
  if (open.docs.length) {
    return error("ALREADY_FLAGGED", "You already flagged this review");
  }

  const flag = (await payload.create({
    collection: "flags",
    data: {
      review: review.id,
      reporter: user.id,
      reason: parsed.data.reason,
      note: parsed.data.note || "",
      status: "open",
    },
    overrideAccess: true,
    user,
  })) as Flag;

  await payload.update({
    collection: "reviews",
    id: review.id,
    data: { flagCount: (review.flagCount || 0) + 1 },
    overrideAccess: true,
    context: { skipStats: true },
  });

  if (placeSlug) revalidatePath(`/place/${placeSlug}`);
  return { ok: true, data: { flagId: flag.id } };
}
