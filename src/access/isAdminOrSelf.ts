import type { Access, FieldAccess } from "payload";
import type { User } from "@/payload-types";

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  const u = user as User | null;
  if (!u) return false;
  if (u.role === "admin") return true;
  return { id: { equals: u.id } };
};

export const isAdminOrSelfFieldLevel: FieldAccess = ({ id, req: { user } }) => {
  const u = user as User | null;
  if (!u) return false;
  if (u.role === "admin") return true;
  return u.id === id;
};
