import { describe, expect, it } from "vitest";
import { canViewOwnPending, visibleContentQuery } from "./places-logic";

const place = (status: string, submittedBy?: string) => ({
  status,
  submittedBy,
});

describe("canViewOwnPending", () => {
  it("allows approved places for anyone", () => {
    expect(canViewOwnPending(place("approved"), null)).toBe(true);
    expect(canViewOwnPending(place("approved"), { id: "u1" })).toBe(true);
  });
  it("denies pending places to anonymous and non-owners", () => {
    expect(canViewOwnPending(place("pending", "u1"), null)).toBe(false);
    expect(canViewOwnPending(place("pending", "u1"), { id: "u2" })).toBe(false);
  });
  it("allows the owner to view their own pending place", () => {
    expect(canViewOwnPending(place("pending", "u1"), { id: "u1" })).toBe(true);
  });
  it("resolves object submittedBy", () => {
    expect(
      canViewOwnPending(
        { status: "pending", submittedBy: { id: "u1" } },
        { id: "u1" },
      ),
    ).toBe(true);
    expect(
      canViewOwnPending(
        { status: "pending", submittedBy: { id: "u1" } },
        { id: "u2" },
      ),
    ).toBe(false);
  });
  it("allows admins to view any place", () => {
    expect(
      canViewOwnPending(place("pending", "u1"), { id: "admin", role: "admin" }),
    ).toBe(true);
    expect(
      canViewOwnPending(place("rejected", "u1"), {
        id: "admin",
        role: "admin",
      }),
    ).toBe(true);
  });
  it("denies rejected places to the owner", () => {
    expect(canViewOwnPending(place("rejected", "u1"), { id: "u1" })).toBe(
      false,
    );
  });
});

describe("visibleContentQuery", () => {
  it("anonymous sees approved only", () => {
    expect(visibleContentQuery(null)).toEqual({
      status: { equals: "approved" },
    });
  });
  it("owner sees approved or own pending", () => {
    expect(visibleContentQuery({ id: "u1" })).toEqual({
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
