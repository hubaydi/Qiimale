import type { CollectionConfig } from "payload";
import { authenticated } from "../access/authenticated";
import { isAdmin } from "../access/isAdmin";

export const Media: CollectionConfig = {
  slug: "media",
  admin: { useAsTitle: "filename" },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: isAdmin,
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
