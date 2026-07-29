import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "../access/isAdmin";
import {
  recomputeOnUpvoteChange,
  recomputeOnUpvoteDelete,
} from "../hooks/recomputeUpvoteCount";

export const ReviewUpvotes: CollectionConfig = {
  slug: "review-upvotes",
  admin: { useAsTitle: "review", hidden: true },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
    admin: isAdminAccess,
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
