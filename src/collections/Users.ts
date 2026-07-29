import type { CollectionConfig } from "payload";
import { isAdmin, isAdminAccess } from "../access/isAdmin";

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
    forgotPassword: {
      generateEmailSubject: () => "Qiimale — erey sir cusub",
      generateEmailHTML: ({ token } = {}) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/reset-password?token=${token}`;
        return `<p>Waxaa la codsaday in ereyga sirta ah ee akoonkaaga Qiimale la beddelo. Haddii adiga uu yahay codsiga, fadlan guji xiriiriyaha hoose:</p><p><a href="${url}">${url}</a></p><p>Haddii aadan codsan, fadlan iska indhatir iimaylkan.</p>`;
      },
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "_verified"],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: isAdminAccess,
  },
  fields: [
    { name: "email", type: "email" },
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
