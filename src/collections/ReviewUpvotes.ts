import type { CollectionConfig } from "payload";
import { authenticated } from "../access/authenticated";
import { verifiedOnly } from "../access/verifiedOnly";
import {
  recomputeOnUpvoteChange,
  recomputeOnUpvoteDelete,
} from "../hooks/recomputeUpvoteCount";

export const ReviewUpvotes: CollectionConfig = {
  slug: "review-upvotes",
  admin: { useAsTitle: "review", hidden: true },
  access: {
    read: () => true,
    create: verifiedOnly,
    update: () => false,
    delete: authenticated,
  },
  hooks: {
    afterChange: [recomputeOnUpvoteChange],
    afterDelete: [recomputeOnUpvoteDelete],
  },
  fields: [
    {
      name: "review",
      type: "relationship",
      relationTo: "reviews",
      required: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
  ],
  indexes: [{ fields: ["review", "user"], unique: true }],
};
