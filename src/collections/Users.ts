import type { CollectionConfig } from "payload";
import { render } from "react-email";
import { isAdmin, isAdminAccess } from "@/access/isAdmin";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import VerifyEmail from "@/emails/VerifyEmail";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 604800,
    verify: {
      generateEmailSubject: () => "Xaqiiji iimaylkaaga Qiimale",
      generateEmailHTML: async ({ token, user }) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/verify?token=${token}`;
        return render(
          VerifyEmail({ name: (user as { name?: string }).name, url }),
        );
      },
    },
    forgotPassword: {
      generateEmailSubject: () => "Qiimale — erey sir cusub",
      generateEmailHTML: async ({ token, user } = {}) => {
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL || ""}/reset-password?token=${token}`;
        return render(
          ResetPasswordEmail({ name: (user as { name?: string }).name, url }),
        );
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
