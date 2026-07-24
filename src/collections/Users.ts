import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/isAdmin";
import { isAdminOrSelf } from "../access/isAdminOrSelf";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    verify: {
      generateEmailSubject: () => "Xaqiiji iimaylkaaga Qiimale",
      generateEmailHTML: ({ token }) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/verify?token=${token}`;
        return `<p>Fadlan xaqiiji iimaylkaaga qiimaynta Qiimale:</p><p><a href="${url}">${url}</a></p>`;
      },
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "_verified"],
  },
  access: {
    read: () => true,
    create: () => true,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      options: ["admin", "reviewer"],
      defaultValue: "reviewer",
      required: true,
      saveToJWT: true,
      admin: { position: "sidebar" },
    },
  ],
};
