import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./url";

describe("normalizeUrl", () => {
  it("adds https:// when protocol is missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("keeps existing protocols", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });
});
