import type { Access } from "payload";

export const publishedPlaces: Access = ({ req: { user } }) => {
  const u = user;
  if (u?.role === "admin") return true;
  const base = { status: { equals: "approved" } };
  if (u) return { or: [base, { submittedBy: { equals: u.id } }] };
  return base;
};
