import { describe, expect, it } from "vitest";
import { isSafeLocalPath } from "./login-redirect";

describe("isSafeLocalPath", () => {
  it("accepts local paths", () => {
    expect(isSafeLocalPath("/")).toBe(true);
    expect(isSafeLocalPath("/places/foo")).toBe(true);
    expect(isSafeLocalPath("/so/places/foo")).toBe(true);
  });

  it("rejects external and unsafe targets", () => {
    expect(isSafeLocalPath("//evil.com")).toBe(false);
    expect(isSafeLocalPath("https://evil.com")).toBe(false);
    expect(isSafeLocalPath("/\\evil.com")).toBe(false);
    expect(isSafeLocalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeLocalPath("places/foo")).toBe(false);
  });
});
