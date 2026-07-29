import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "../access/isAdmin";
import {
  recomputeOnReviewChange,
  recomputeOnReviewDelete,
} from "../hooks/recomputePlaceStats";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    useAsTitle: "rating",
    defaultColumns: [
      "rating",
      "place",
      "author",
      "status",
      "upvoteCount",
      "flagCount",
    ],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  hooks: {
    afterChange: [recomputeOnReviewChange],
    afterDelete: [recomputeOnReviewDelete],
  },
  fields: [
    {
      name: "place",
      type: "relationship",
      relationTo: "places",
      required: true,
      index: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "rating",
      type: "number",
      required: true,
      min: 1,
      max: 5,
    },
    { name: "text", type: "textarea", required: true },
    {
      name: "photos",
      type: "array",
      maxRows: 3,
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
      ],
    },
    {
      name: "status",
      type: "select",
      options: ["published", "hidden", "removed"],
      defaultValue: "published",
      required: true,
      index: true,
      admin: { position: "sidebar" },
    },
    {
      name: "upvoteCount",
      type: "number",
      defaultValue: 0,
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "flagCount",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
  indexes: [{ fields: ["place", "author"] }],
};
