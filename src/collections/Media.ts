import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "@/access/isAdmin";

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
    formatOptions: { format: "webp", options: { quality: 80 } },
    resizeOptions: { max: true, width: 1600 },
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 800 },
    ],
  },
  fields: [{ name: "alt", type: "text" }],
};
