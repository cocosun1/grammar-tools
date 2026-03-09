"use client";

import { useState, FormEvent } from "react";
import styles from "./LoginModal.module.css";

interface Props {
  onLogin: (username: string, password: string) => boolean;
}

export function LoginModal({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }
    const ok = onLogin(username, password);
    if (ok) {
      setUsername("");
      setPassword("");
      setError("");
    } else {
      setError("用户名或密码错误");
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className={styles.modal}>
        <h2 id="login-title" className={styles.title}>
          登录
        </h2>
        <p className={styles.subtitle}>
          请输入您的账号信息以继续使用
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="login-username" className={styles.label}>
            用户名
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={styles.input}
            autoFocus
          />
          <label htmlFor="login-password" className={styles.label}>
            密码
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit}>
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
