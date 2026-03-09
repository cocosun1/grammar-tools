"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/auth";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const admin = isAdmin(user);

  return (
    <header className="site-header">
      <Link href="/" className="site-title">
        英语语法练习
      </Link>
      <nav className="site-nav">
        <Link href="/">首页</Link>
        {admin && (
          <Link href="/admin/question-bank">题库</Link>
        )}
        {user && (
          <span className="header-user">
            <span className="header-username">{user}</span>
            <button
              type="button"
              className="btn-logout"
              onClick={logout}
              aria-label="退出登录"
            >
              退出
            </button>
          </span>
        )}
      </nav>
    </header>
  );
}
