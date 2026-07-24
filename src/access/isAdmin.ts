import type { Access, FieldAccess } from "payload";

export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user);
};

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  return Boolean(user);
};
