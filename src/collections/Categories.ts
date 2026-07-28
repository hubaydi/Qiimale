import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { authenticated } from "../access/authenticated";
import { isAdmin, isAdminAccess } from "../access/isAdmin";

export const Categories: CollectionConfig = {
  slug: "categories",
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
    {
      name: "icon",
      type: "text",
      admin: {
        position: "sidebar",
        description: "lucide icon name, e.g. utensils, graduation-cap",
      },
    },
  ],
};
