import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { authenticated } from "../access/authenticated";
import { isAdmin, isAdminAccess } from "../access/isAdmin";

export const Cities: CollectionConfig = {
  slug: "cities",
  admin: { useAsTitle: "name" },
  access: {
    read: () => true,
    create: authenticated,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    slugField({ useAsSlug: "name", position: "sidebar" }),
  ],
};
