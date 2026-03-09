"use client";

import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "./LoginModal";

interface Props {
  children: React.ReactNode;
}

export function AuthGate({ children }: Props) {
  const { user, isLoaded, login } = useAuth();

  if (!isLoaded) {
    return (
      <div className="auth-loading">
        <p>加载中…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginModal onLogin={login} />;
  }

  return <>{children}</>;
}
