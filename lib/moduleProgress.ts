import { getCurrentUserId } from "@/lib/auth";

function getStorageKey(suffix: string): string | null {
  const userId = getCurrentUserId();
  return userId ? `yj_${userId}_${suffix}` : null;
}

export function hasSeenIntro(moduleId: number): boolean {
  if (typeof window === "undefined") return false;
  const key = getStorageKey("module_seen_intro");
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    return !!data[`m${moduleId}`];
  } catch {
    return false;
  }
}

export function markIntroSeen(moduleId: number): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey("module_seen_intro");
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    data[`m${moduleId}`] = true;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export interface LevelProgress {
  score: number;
  stars: number;
}

export interface ModuleProgress {
  module: number;
  level1?: LevelProgress;
  level2?: LevelProgress;
  level3?: LevelProgress;
}

export function loadModuleProgress(moduleId: number): ModuleProgress | null {
  if (typeof window === "undefined") return null;
  const storageKey = getStorageKey("module_progress");
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const key = `m${moduleId}`;
    const mod = data[key];
    if (mod && typeof mod === "object" && "module" in mod) {
      return mod as ModuleProgress;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Saves progress, keeping the highest score and stars (never overwrites with lower). */
export function saveModuleProgress(moduleId: number, level: 1 | 2 | 3, progress: LevelProgress): void {
  if (typeof window === "undefined") return;
  const storageKey = getStorageKey("module_progress");
  if (!storageKey) return;
  try {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const key = `m${moduleId}`;
    const existing = (data[key] as ModuleProgress) ?? { module: moduleId };
    const next: ModuleProgress = { ...existing };
    const existingForLevel = (next[`level${level}` as keyof ModuleProgress] as LevelProgress | undefined);
    const merged: LevelProgress = existingForLevel
      ? {
          score: Math.max(existingForLevel.score, progress.score),
          stars: Math.max(existingForLevel.stars, progress.stars),
        }
      : progress;
    if (level === 1) next.level1 = merged;
    if (level === 2) next.level2 = merged;
    if (level === 3) next.level3 = merged;
    data[key] = next;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** L2 unlocks at 90% on L1. L3 unlocks at 15 correct on L2. */
export const L2_UNLOCK_SCORE = 90;
export const L3_UNLOCK_CORRECT = 15;

/** Compute stars. L1/L3: accuracy 60/80/100. L2: correct count 6/10/15. */
export function scoreToStars(score: number, level?: 1 | 2 | 3): number {
  if (level === 2) {
    if (score >= 15) return 3;
    if (score >= 10) return 2;
    if (score >= 6) return 1;
    return 0;
  }
  if (score >= 100) return 3;
  if (score >= 80) return 2;
  if (score >= 60) return 1;
  return 0;
}
