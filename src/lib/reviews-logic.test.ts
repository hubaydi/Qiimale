import { describe, expect, it } from "vitest";
import {
  canPublishReview,
  canUpvote,
  computeStats,
  hasExistingReview,
} from "./reviews-logic";

describe("computeStats", () => {
  it("averages ratings and counts published reviews", () => {
    expect(computeStats([5, 3, 4])).toEqual({ count: 3, avg: 4 });
  });
  it("rounds avg to 2 decimals", () => {
    expect(computeStats([5, 4, 4])).toEqual({ count: 3, avg: 4.33 });
  });
  it("handles empty list", () => {
    expect(computeStats([])).toEqual({ count: 0, avg: 0 });
  });
  it("handles single review", () => {
    expect(computeStats([2])).toEqual({ count: 1, avg: 2 });
  });
});

describe("hasExistingReview", () => {
  it("true when a review by the user already exists for the place", () => {
    expect(hasExistingReview([{ author: "u1" }, { author: "u2" }], "u1")).toBe(
      true,
    );
  });
  it("false when the user has no review", () => {
    expect(hasExistingReview([{ author: "u1" }, { author: "u2" }], "u3")).toBe(
      false,
    );
  });
  it("handles undefined list", () => {
    expect(hasExistingReview(undefined, "u1")).toBe(false);
  });
});

describe("canUpvote", () => {
  it("rejects self-upvote", () => {
    expect(canUpvote("u1", "u1")).toBe(false);
  });
  it("allows upvoting others", () => {
    expect(canUpvote("u1", "u2")).toBe(true);
  });
});

describe("canPublishReview", () => {
  it("requires a verified user", () => {
    expect(canPublishReview(null)).toBe(false);
    expect(canPublishReview({ _verified: false })).toBe(false);
    expect(canPublishReview({ _verified: true })).toBe(true);
    expect(canPublishReview({} as never)).toBe(false);
  });
});
