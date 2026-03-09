/**
 * Normalizes an answer string for comparison so that minor formatting
 * differences do not cause a correct answer to be marked incorrect.
 * - Trim leading and trailing spaces
 * - Ignore final punctuation (. ? !)
 * - Collapse multiple spaces into a single space
 * - Lowercase for case-insensitive comparison
 */
export function normalizeAnswer(s: string | null | undefined): string {
  if (s == null || typeof s !== "string") return "";
  let t = s.trim();
  t = t.replace(/\s+/g, " ");
  t = t.replace(/[.?!]+$/, "");
  t = t.trim();
  return t.toLowerCase();
}

/**
 * Returns true if the user answer matches the correct answer after normalization.
 */
export function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
