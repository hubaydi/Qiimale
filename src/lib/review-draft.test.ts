import { describe, expect, it } from "vitest";
import {
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "./review-draft";

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
}

describe("reviewDraft", () => {
  it("saves and loads a draft scoped to placeId", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 4, text: "Waa fiican" });
    saveReviewDraft(s, "p2", { rating: 2, text: "Xun" });
    expect(loadReviewDraft(s, "p1")).toEqual({ rating: 4, text: "Waa fiican" });
    expect(loadReviewDraft(s, "p2")).toEqual({ rating: 2, text: "Xun" });
  });

  it("is one-shot: reading consumes the draft", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 5, text: "A" });
    expect(loadReviewDraft(s, "p1")).toEqual({ rating: 5, text: "A" });
    expect(loadReviewDraft(s, "p1")).toBeNull();
  });

  it("returns null for missing, corrupt, or invalid drafts", () => {
    const s = createMockStorage();
    expect(loadReviewDraft(s, "nope")).toBeNull();
    s.setItem("qiimale:review-draft:bad", "{not json");
    expect(loadReviewDraft(s, "bad")).toBeNull();
    s.setItem(
      "qiimale:review-draft:bad2",
      JSON.stringify({ rating: 9, text: "x" }),
    );
    expect(loadReviewDraft(s, "bad2")).toBeNull();
  });

  it("clear removes the draft", () => {
    const s = createMockStorage();
    saveReviewDraft(s, "p1", { rating: 3, text: "B" });
    clearReviewDraft(s, "p1");
    expect(loadReviewDraft(s, "p1")).toBeNull();
  });
});
