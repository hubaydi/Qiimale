import type { CollectionAfterChangeHook } from "payload";
import { resyncPlaceStats } from "@/hooks/recomputePlaceStats";

export const recomputeOnServiceStatusChange: CollectionAfterChangeHook =
  async ({ doc, previousDoc, req }) => {
    const before = (previousDoc as { status?: string } | undefined)?.status;
    if (before === doc.status) return doc;

    const reviews = await req.payload.find({
      collection: "reviews",
      where: { service: { equals: doc.id } },
      limit: 100000,
      req,
    });

    const placeIds = new Set(
      reviews.docs
        .map((r) =>
          typeof r.place === "string"
            ? r.place
            : (r.place as { id?: string })?.id,
        )
        .filter((id): id is string => Boolean(id)),
    );

    for (const placeId of placeIds) {
      await resyncPlaceStats({ payload: req.payload, placeId, req });
    }
    return doc;
  };
