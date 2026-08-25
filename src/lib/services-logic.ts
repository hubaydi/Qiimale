import type { Where } from "payload";

type Viewer = { id: string; role?: string } | null;

type ServiceRef = {
  status: string;
  submittedBy?: string | { id?: string } | null;
};

export function canViewService(
  service: ServiceRef | null | undefined,
  user: Viewer,
): boolean {
  if (!service) return false;
  if (service.status === "approved") return true;
  if (user?.role === "admin") return true;
  const ownerId =
    typeof service.submittedBy === "object"
      ? service.submittedBy?.id
      : service.submittedBy;
  return (
    service.status === "pending" && ownerId != null && ownerId === user?.id
  );
}

export function reviewIsVisible(
  review: { status: string; service?: unknown },
  user: Viewer,
): boolean {
  if (review.status !== "published") return false;
  if (review.service == null) return true;
  if (typeof review.service === "string") return false;
  return canViewService(review.service as ServiceRef, user);
}

export function visibleServicesQuery(user: Viewer): Where {
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
