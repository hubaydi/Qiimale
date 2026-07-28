import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { authenticated } from "../access/authenticated";
import { isAdmin } from "../access/isAdmin";
import { publishedPlaces } from "../access/publishedPlaces";
import { verifiedOnly } from "../access/verifiedOnly";

export const Places: CollectionConfig = {
  slug: "places",
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "category",
      "city",
      "status",
      "reviewCount",
      "ratingAvg",
    ],
  },
  access: {
    read: publishedPlaces,
    create: verifiedOnly,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name", position: "sidebar" }),
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "city",
      type: "relationship",
      relationTo: "cities",
      required: true,
      admin: { position: "sidebar" },
    },
    { name: "address", type: "text" },
    { name: "description", type: "textarea" },
    {
      name: "status",
      type: "select",
      options: ["pending", "approved", "rejected"],
      defaultValue: "pending",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "submittedBy",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "ratingAvg",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "reviewCount",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  indexes: [
    { fields: ["category"] },
    { fields: ["city"] },
    { fields: ["status"] },
    { fields: ["ratingAvg"] },
  ],
};
