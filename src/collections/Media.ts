import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "@/access/isAdmin";
import { verifiedOnly } from "@/access/verifiedOnly";

export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "filename" },
  access: {
    read: () => true,
    create: verifiedOnly,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  upload: {
    mimeTypes: ["image/*"],
    formatOptions: { format: "webp", options: { quality: 80 } },
    resizeOptions: { width: 1600, withoutEnlargement: true },
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 800 },
    ],
  },
  fields: [{ name: "alt", type: "text" }],
};
