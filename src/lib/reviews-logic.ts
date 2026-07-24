export function computeStats(ratings: number[]): {
  count: number;
  avg: number;
} {
  if (!ratings.length) return { count: 0, avg: 0 };
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = Math.round((sum / ratings.length) * 100) / 100;
  return { count: ratings.length, avg };
}

export function hasExistingReview(
  reviews: { author: string | { id: string } }[] | undefined | null,
  userId: string,
): boolean {
  if (!reviews) return false;
  return reviews.some((r) =>
    typeof r.author === "string" ? r.author === userId : r.author.id === userId,
  );
}

export function canUpvote(
  reviewAuthorId: string,
  currentUserId: string,
): boolean {
  return reviewAuthorId !== currentUserId;
}

export function canPublishReview(
  user: { _verified?: boolean } | null,
): boolean {
  return Boolean(user?._verified);
}
