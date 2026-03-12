import type { Question } from "@/types/question";

/**
 * Fisher–Yates shuffle.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Normalize for dedup: collapse all pronouns to P and be-verbs (was/were/am/is/are) to "be" so "He was" and "You were" are treated as same structure. */
function canonicalPrompt(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s
    .trim()
    .replace(/\b(He|She|I|me|my|We|us|our|They|them|their|You|your)\b/gi, "P")
    .replace(/\b(was|were|am|is|are)\b/gi, "be")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Signature for deduplication: type + canonical prompt + answer. Options are excluded so that
 * He/She ____ home late (same answer) are treated as the same structure and not both shown. */
export function questionSignature(q: Question): string {
  const qq = q as { prompt_en?: string; question_en?: string };
  const prompt = (qq.prompt_en ?? qq.question_en ?? "").toString();
  const answer = (q.answer ?? "").toString();
  return `${q.type}:${canonicalPrompt(prompt)}:${canonicalPrompt(answer)}`;
}

/**
 * Select n questions with a balanced mix of types when possible.
 * Avoids picking multiple questions with the same canonical form (e.g. He vs She variants).
 */
export function selectBalancedQuestions(
  questions: Question[],
  n: number
): Question[] {
  if (questions.length <= n) {
    return shuffle(questions);
  }

  const byType = new Map<string, Question[]>();
  for (const q of questions) {
    const list = byType.get(q.type) ?? [];
    list.push(q);
    byType.set(q.type, list);
  }

  const types = Array.from(byType.keys());
  const result: Question[] = [];
  const usedIds = new Set<string>();
  const usedSignatures = new Set<string>();

  const addIfNovel = (q: Question): boolean => {
    if (usedIds.has(q.id)) return false;
    const sig = questionSignature(q);
    if (usedSignatures.has(sig)) return false;
    usedIds.add(q.id);
    usedSignatures.add(sig);
    result.push(q);
    return true;
  };

  // First pass: take at least one from each type, preferring novel signatures
  const shuffledTypes = shuffle(types);
  for (const type of shuffledTypes) {
    if (result.length >= n) break;
    const pool = byType.get(type)!;
    const shuffled = shuffle(pool);
    for (const q of shuffled) {
      if (result.length >= n) break;
      addIfNovel(q);
    }
  }

  // Second pass: fill remaining with novel questions
  if (result.length < n) {
    const remaining = shuffle(questions.filter((q) => !usedIds.has(q.id)));
    for (const q of remaining) {
      if (result.length >= n) break;
      addIfNovel(q);
    }
  }

  // Third pass: if still short, allow same id only when signature is novel (brute-force: never allow same structure in batch)
  if (result.length < n) {
    const remaining = shuffle(questions.filter((q) => !usedIds.has(q.id)));
    for (const q of remaining) {
      if (result.length >= n) break;
      const sig = questionSignature(q);
      if (usedSignatures.has(sig)) continue; // skip—would be structurally duplicate
      usedIds.add(q.id);
      usedSignatures.add(sig);
      result.push(q);
    }
  }

  return shuffle(result);
}

/**
 * Select n random questions (no balancing).
 */
export function selectRandomQuestions(
  questions: Question[],
  n: number
): Question[] {
  if (questions.length <= n) return shuffle(questions);
  return shuffle(questions).slice(0, n);
}

/**
 * Select n random items from an array (generic).
 * For items where getSignature returns a string, avoids picking multiple with the same signature.
 */
export function selectRandomItems<T>(
  items: T[],
  n: number,
  getSignature?: (item: T) => string | null
): T[] {
  if (items.length <= n) return shuffle(items);
  if (getSignature) {
    const usedSigs = new Set<string>();
    const selected: T[] = [];
    const shuffled = shuffle(items);
    for (const item of shuffled) {
      if (selected.length >= n) break;
      const sig = getSignature(item);
      if (sig != null && usedSigs.has(sig)) continue;
      if (sig != null) usedSigs.add(sig);
      selected.push(item);
    }
    if (selected.length >= n) return selected;
  }
  return shuffle(items).slice(0, n);
}
