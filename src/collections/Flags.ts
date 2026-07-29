import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "../access/isAdmin";

export const Flags: CollectionConfig = {
  slug: "flags",
  admin: {
    useAsTitle: "reason",
    defaultColumns: ["review", "reporter", "reason", "status", "createdAt"],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
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
      name: "reporter",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "reason",
      type: "select",
      options: ["fake", "offensive", "spam", "coi", "other"],
      required: true,
    },
    { name: "note", type: "text" },
    {
      name: "status",
      type: "select",
      options: ["open", "resolved"],
      defaultValue: "open",
      required: true,
      index: true,
      admin: { position: "sidebar" },
    },
  ],
};
