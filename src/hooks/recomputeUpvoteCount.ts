import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from "payload";

async function resync(args: {
  payload: Payload;
  reviewId: string;
  req: PayloadRequest;
}) {
  if (args.req.context.skipUpvoteStats) return;
  const res = await args.payload.find({
    collection: "review-upvotes",
    where: { review: { equals: args.reviewId } },
    limit: 0,
    req: args.req,
  });
  await args.payload.update({
    collection: "reviews",
    id: args.reviewId,
    data: { upvoteCount: res.totalDocs },
    overrideAccess: true,
    req: args.req,
    context: { skipUpvoteStats: true, skipStats: true },
  });
}

export const recomputeOnUpvoteChange: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const reviewId = typeof doc.review === "string" ? doc.review : doc.review?.id;
  if (reviewId) await resync({ payload: req.payload, reviewId, req });
  return doc;
};

export const recomputeOnUpvoteDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const reviewId = doc?.review
    ? typeof doc.review === "string"
      ? doc.review
      : doc.review.id
    : null;
  if (reviewId) await resync({ payload: req.payload, reviewId, req });
};
