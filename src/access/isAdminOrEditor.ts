import type { FieldAccess, PayloadRequest } from "payload";

export const isAdminOrEditor = ({
  req: { user },
}: {
  req: PayloadRequest;
}): boolean => {
  return Boolean(user);
};

export const isAdminOrEditorFieldLevel: FieldAccess = ({ req: { user } }) => {
  return Boolean(user);
};
