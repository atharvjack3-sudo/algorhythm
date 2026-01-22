export function expectedScore(userRating, problemRating) {
  return 1 / (1 + Math.pow(10, (problemRating - userRating) / 400));
}

export function kFactor(attempts) {
  return attempts < 20 ? 40 : 20;
}

export function updateRating(oldRating, problemRating, attempts, solved, numTopics) {
  const expected = expectedScore(oldRating, problemRating);
  const K = kFactor(attempts) / numTopics;
  const score = solved ? 1 : 0;
  return Math.round(oldRating + K * (score - expected));
}
