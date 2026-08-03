import { describe, expect, it } from "vitest";
import { placeDescription } from "./place-meta";

function makePlace(overrides: Record<string, unknown>) {
  return {
    id: "1",
    name: "Test Place",
    slug: "test-place",
    category: "cat1",
    city: "city1",
    description: null,
    ratingAvg: 4.2,
    reviewCount: 5,
    updatedAt: "2026-01-01",
    createdAt: "2026-01-01",
    status: "approved" as const,
    ...overrides,
  };
}

describe("placeDescription", () => {
  it("uses place.description when present", () => {
    const place = makePlace({ description: "A great spot" });
    expect(placeDescription(place, "so")).toBe("A great spot");
    expect(placeDescription(place, "en")).toBe("A great spot");
  });

  it("falls back to template when description is null", () => {
    const place = makePlace({ description: null });
    const en = placeDescription(place, "en");
    expect(en).toContain("4.2");
    expect(en).toContain("5 reviews");
    expect(en).toContain("on Qiimale");
  });

  it("falls back to template when description is empty string", () => {
    const place = makePlace({ description: "" });
    const so = placeDescription(place, "so");
    expect(so).toContain("4.2");
    expect(so).toContain("5");
  });
});
