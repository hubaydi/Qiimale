import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { isAdmin } from "../access/isAdmin";

export const Cities: CollectionConfig = {
  slug: "cities",
  admin: { useAsTitle: "name" },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    slugField({ useAsSlug: "name", position: "sidebar" }),
  ],
};
