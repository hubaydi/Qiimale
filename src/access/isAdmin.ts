import type { Access, FieldAccess, PayloadRequest } from "payload";
import type { User } from "@/payload-types";

export const isAdmin: Access = ({ req: { user } }) => {
  return (user as User | null)?.role === "admin";
};

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  return (user as User | null)?.role === "admin";
};

export const isAdminAccess = ({ req: { user } }: { req: PayloadRequest }): boolean => {
  return (user as User | null)?.role === "admin";
};
