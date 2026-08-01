import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { isAdmin, isAdminAccess } from "@/access/isAdmin";

export const Cities: CollectionConfig = {
  slug: "cities",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "status", "submittedBy"],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    slugField({ useAsSlug: "name", position: "sidebar" }),
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
  ],
};
