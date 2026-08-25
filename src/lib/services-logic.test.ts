import { describe, expect, it } from "vitest";
import {
  canViewService,
  reviewIsVisible,
  visibleServicesQuery,
} from "./services-logic";

const service = (status: string, submittedBy?: string) => ({
  status,
  submittedBy,
});

describe("canViewService", () => {
  it("allows approved services for anyone", () => {
    expect(canViewService(service("approved"), null)).toBe(true);
    expect(canViewService(service("approved"), { id: "u1" })).toBe(true);
  });
  it("denies pending services to anonymous and non-owners", () => {
    expect(canViewService(service("pending", "u1"), null)).toBe(false);
    expect(canViewService(service("pending", "u1"), { id: "u2" })).toBe(false);
  });
  it("allows the owner to view their own pending service", () => {
    expect(canViewService(service("pending", "u1"), { id: "u1" })).toBe(true);
  });
  it("denies an ownerless pending service to anonymous users", () => {
    expect(canViewService(service("pending"), null)).toBe(false);
  });
  it("recognizes the owner via object submittedBy", () => {
    expect(
      canViewService(
        { status: "pending", submittedBy: { id: "u1" } },
        { id: "u1" },
      ),
    ).toBe(true);
  });
  it("allows admins to view any service", () => {
    expect(
      canViewService(service("pending", "u1"), { id: "admin", role: "admin" }),
    ).toBe(true);
    expect(
      canViewService(service("rejected", "u1"), { id: "admin", role: "admin" }),
    ).toBe(true);
  });
  it("denies rejected services to the owner", () => {
    expect(canViewService(service("rejected", "u1"), { id: "u1" })).toBe(false);
  });
  it("returns false for a null service", () => {
    expect(canViewService(null, { id: "u1" })).toBe(false);
  });
});

describe("reviewIsVisible", () => {
  it("hides non-published reviews", () => {
    expect(reviewIsVisible({ status: "hidden" }, null)).toBe(false);
  });
  it("shows published reviews with no service", () => {
    expect(reviewIsVisible({ status: "published", service: null }, null)).toBe(
      true,
    );
  });
  it("shows published reviews on an approved service", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("approved") },
        null,
      ),
    ).toBe(true);
  });
  it("hides published reviews on a pending service from strangers", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("pending", "u1") },
        null,
      ),
    ).toBe(false);
  });
  it("shows published reviews on own pending service to the owner", () => {
    expect(
      reviewIsVisible(
        { status: "published", service: service("pending", "u1") },
        { id: "u1" },
      ),
    ).toBe(true);
  });
  it("hides reviews whose service is an unpopulated id string", () => {
    expect(
      reviewIsVisible({ status: "published", service: "svc1" }, null),
    ).toBe(false);
  });
});

describe("visibleServicesQuery", () => {
  it("anonymous sees approved only", () => {
    expect(visibleServicesQuery(null)).toEqual({
      status: { equals: "approved" },
    });
  });
  it("owner sees approved or own pending", () => {
    expect(visibleServicesQuery({ id: "u1" })).toEqual({
      or: [
        { status: { equals: "approved" } },
        {
          and: [
            { status: { equals: "pending" } },
            { submittedBy: { equals: "u1" } },
          ],
        },
      ],
    });
  });
});
