const CURRENT_USER_KEY = "yj_current_user";

const USERS: Record<string, string> = {
  Coco: "Coco",
  Jaelynn: "Jaelynn",
  Guest: "hihihi",
};

export const ADMIN_USERNAME = "Coco";

export function isAdmin(username: string | null): boolean {
  return username === ADMIN_USERNAME;
}

export function verifyCredentials(username: string, password: string): boolean {
  const trimmed = username.trim();
  if (!trimmed) return false;
  return USERS[trimmed] === password;
}

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && typeof parsed.username === "string") {
      return parsed.username;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCurrentUser(username: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ username }));
  } catch {
    // ignore
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // ignore
  }
}
