import type { Where } from "payload";

export function canViewOwnPending(
  doc: {
    status: string;
    submittedBy?: string | { id?: string } | null;
  },
  user: { id: string; role?: string } | null,
): boolean {
  if (doc.status === "approved") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const ownerId =
    typeof doc.submittedBy === "object" ? doc.submittedBy?.id : doc.submittedBy;
  return doc.status === "pending" && ownerId === user.id;
}

export function visibleContentQuery(
  user: { id: string; role?: string } | null,
): Where {
  if (!user) return { status: { equals: "approved" } };
  return {
    or: [
      { status: { equals: "approved" } },
      {
        and: [
          { status: { equals: "pending" } },
          { submittedBy: { equals: user.id } },
        ],
      },
    ],
  };
}
