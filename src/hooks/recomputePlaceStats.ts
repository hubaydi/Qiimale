import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from "payload";
import { computeStats } from "@/lib/reviews-logic";

async function resync(args: {
  payload: Payload;
  placeId: string;
  req: PayloadRequest;
}) {
  if (args.req.context.skipStats) return;
  const full = await args.payload.find({
    collection: "reviews",
    where: {
      and: [
        { place: { equals: args.placeId } },
        { status: { equals: "published" } },
      ],
    },
    limit: 100000,
    req: args.req,
  });
  const stats = computeStats(full.docs.map((d) => d.rating));
  await args.payload.update({
    collection: "places",
    id: args.placeId,
    data: { ratingAvg: stats.avg, reviewCount: stats.count },
    overrideAccess: true,
    req: args.req,
    context: { skipStats: true },
  });
}

export const recomputeOnReviewChange: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const placeId = typeof doc.place === "string" ? doc.place : doc.place?.id;
  if (!placeId) return doc;
  await resync({ payload: req.payload, placeId, req });
  return doc;
};

export const recomputeOnReviewDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const placeId = doc?.place
    ? typeof doc.place === "string"
      ? doc.place
      : doc.place.id
    : null;
  if (!placeId) return;
  await resync({ payload: req.payload, placeId, req });
};
