import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "../access/isAdmin";

export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "filename" },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  upload: {
    mimeTypes: ["image/*"],
    formatOptions: { format: "webp" },
    imageSizes: [
      { name: "thumb", width: 400, height: 400, position: "centre" },
      { name: "card", width: 800, height: 800, position: "centre" },
    ],
  },
  fields: [{ name: "alt", type: "text" }],
};
