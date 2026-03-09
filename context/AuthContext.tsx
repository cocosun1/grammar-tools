"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getCurrentUserId, setCurrentUser, clearCurrentUser, verifyCredentials } from "@/lib/auth";

interface AuthContextValue {
  user: string | null;
  isLoaded: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUser(getCurrentUserId());
    setIsLoaded(true);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (!verifyCredentials(username, password)) return false;
    const trimmed = username.trim();
    setCurrentUser(trimmed);
    setUser(trimmed);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearCurrentUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
