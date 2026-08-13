export type ReviewDraft = { rating: number; text: string };
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const key = (placeId: string) => `qiimale:review-draft:${placeId}`;

export function saveReviewDraft(
  storage: DraftStorage,
  placeId: string,
  draft: ReviewDraft,
): void {
  storage.setItem(key(placeId), JSON.stringify(draft));
}

export function loadReviewDraft(
  storage: DraftStorage,
  placeId: string,
): ReviewDraft | null {
  const raw = storage.getItem(key(placeId));
  if (!raw) return null;
  storage.removeItem(key(placeId));
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const rating = Number((parsed as { rating?: unknown }).rating);
    const text = String((parsed as { text?: unknown }).text ?? "");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
    return { rating, text };
  } catch {
    return null;
  }
}

export function clearReviewDraft(storage: DraftStorage, placeId: string): void {
  storage.removeItem(key(placeId));
}
