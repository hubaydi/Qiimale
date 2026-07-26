import type { Access } from "payload";
import type { User } from "@/payload-types";

export const publishedPlaces: Access = ({ req: { user } }) => {
  const u = user as User | null;
  if (u?.role === "admin") return true;
  const base = { status: { equals: "approved" } };
  if (u) return { or: [base, { submittedBy: { equals: u.id } }] };
  return base;
};
