import type { Access, FieldAccess, PayloadRequest } from "payload";

export const isAdmin: Access = ({ req: { user } }) => {
  return user?.role === "admin";
};

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  return user?.role === "admin";
};

export const isAdminAccess = ({
  req: { user },
}: {
  req: PayloadRequest;
}): boolean => {
  return user?.role === "admin";
};
