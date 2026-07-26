import type { Access } from "payload";
import type { User } from "@/payload-types";

export const verifiedOnly: Access = ({ req: { user } }) =>
  Boolean((user as User | null)?._verified);
