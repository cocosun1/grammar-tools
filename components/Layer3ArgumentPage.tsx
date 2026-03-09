"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArgumentPrompt } from "@/types/layer3Argument";
import styles from "./Layer3ArgumentPage.module.css";

const THINKING_SECONDS = 60;

interface Props {
  prompts: ArgumentPrompt[];
  moduleName_zh: string;
  onBackToMap: () => void;
}

export function Layer3ArgumentPage({
  prompts,
  moduleName_zh,
  onBackToMap,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"thinking" | "revealed">("thinking");
  const [secondsLeft, setSecondsLeft] = useState(THINKING_SECONDS);
  const [timerActive, setTimerActive] = useState(true);

  const prompt = prompts[index];

  useEffect(() => {
    if (phase !== "thinking" || !timerActive) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPhase("revealed");
          setTimerActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, timerActive]);

  const handleShowNow = useCallback(() => {
    setTimerActive(false);
    setPhase("revealed");
    setSecondsLeft(0);
  }, []);

  const handleNext = useCallback(() => {
    if (index + 1 < prompts.length) {
      setIndex((i) => i + 1);
      setPhase("thinking");
      setSecondsLeft(THINKING_SECONDS);
      setTimerActive(true);
    }
  }, [index, prompts.length]);

  if (!prompt) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>暂无题目。</p>
        <button type="button" className={styles.btn} onClick={onBackToMap}>
          返回进度图
        </button>
      </div>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>论点生成练习 · {moduleName_zh}</h1>
        <p className={styles.ungraded}>本练习不评分，仅供思路练习与对照参考。</p>
        <p className={styles.counter}>
          第 {index + 1} 题 / 共 {prompts.length} 题
        </p>
      </header>

      <section className={styles.promptSection}>
        <h2 className={styles.promptLabel}>讨论题</h2>
        <p className={styles.promptText}>{prompt.prompt_en}</p>
        <p className={styles.meta}>
          <span className={styles.metaTag}>{prompt.topic}</span>
          <span className={styles.metaTag}>{prompt.questionType.replace(/_/g, " ")}</span>
        </p>
      </section>

      {phase === "thinking" && (
        <section className={styles.timerSection}>
          <h3 className={styles.timerTitle}>思考时间（1 分钟）</h3>
          <p className={styles.timerHint}>
            可以默想或简单记笔记，构思 2–3 个支持自己观点的理由。
          </p>
          <div className={styles.timerDisplay}>{timeStr}</div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleShowNow}
            aria-label="立即显示参考论点"
          >
            立即显示参考论点
          </button>
        </section>
      )}

      {phase === "revealed" && (
        <section className={styles.argumentsSection}>
          <h3 className={styles.argumentsTitle}>参考论点（仅供对照，无对错）</h3>
          <div className={styles.sideBlock}>
            <h4 className={styles.sideLabel}>一方观点（示例）</h4>
            <ul className={styles.argumentList}>
              {prompt.argumentsOneSide.map((arg, i) => (
                <li key={i}>{arg}</li>
              ))}
            </ul>
          </div>
          <div className={styles.sideBlock}>
            <h4 className={styles.sideLabel}>另一方观点（示例）</h4>
            <ul className={styles.argumentList}>
              {prompt.argumentsOtherSide.map((arg, i) => (
                <li key={i}>{arg}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        {phase === "revealed" && (
          <>
            {index + 1 < prompts.length ? (
              <button type="button" className={styles.btn} onClick={handleNext}>
                下一题
              </button>
            ) : null}
          </>
        )}
        <button type="button" className={styles.btnSecondary} onClick={onBackToMap}>
          返回进度图
        </button>
      </footer>
    </div>
  );
}
