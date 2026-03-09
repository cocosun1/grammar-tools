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

/**
 * Select n questions with a balanced mix of types when possible.
 * Ensures different question types are represented before filling remaining slots.
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
  const used = new Set<string>();

  // First pass: take at least one from each type (up to n total)
  const shuffledTypes = shuffle(types);
  for (const type of shuffledTypes) {
    if (result.length >= n) break;
    const pool = byType.get(type)!;
    const shuffled = shuffle(pool);
    for (const q of shuffled) {
      if (result.length >= n) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        result.push(q);
      }
    }
  }

  // Second pass: fill remaining slots with random questions
  if (result.length < n) {
    const remaining = shuffle(questions.filter((q) => !used.has(q.id)));
    for (const q of remaining) {
      if (result.length >= n) break;
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
 */
export function selectRandomItems<T>(items: T[], n: number): T[] {
  if (items.length <= n) return shuffle(items);
  return shuffle(items).slice(0, n);
}
