import type { Access } from "payload";

export const verifiedOnly: Access = ({ req: { user } }) =>
  Boolean(user?._verified);
