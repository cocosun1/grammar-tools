"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import type { Question } from "@/types/question";
import { QuestionRenderer } from "./QuestionRenderer";
import { answersMatch } from "@/lib/answerUtils";

const BATCH_SIZE = 5;

function isCorrect(question: Question, userAnswer: string): boolean {
  return answersMatch(userAnswer ?? "", question.answer);
}

export interface PracticeCompleteResult {
  correctCount: number;
  total: number;
  accuracy: number;
}

interface Props {
  questions: Question[];
  layerId: string;
  layerName: string;
  moduleName: string;
  onBackToIntro?: () => void;
  practiceMode?: "example" | "real";
  /** Called once when the practice reaches the summary screen (for level modes). */
  onPracticeComplete?: (result: PracticeCompleteResult) => void;
  /** Label for the back button when in level mode (e.g. "返回进度图"). */
  backButtonLabel?: string;
  /** Override batch size (e.g. 10 to show all Level 1 questions on one page). */
  batchSize?: number;
}

export function ModulePractice({
  questions,
  layerId,
  layerName,
  moduleName,
  onBackToIntro,
  practiceMode,
  onPracticeComplete,
  backButtonLabel,
  batchSize = BATCH_SIZE,
}: Props) {
  const batches = useMemo(() => {
    const list: Question[][] = [];
    for (let i = 0; i < questions.length; i += batchSize) {
      list.push(questions.slice(i, i + batchSize));
    }
    return list;
  }, [questions]);

  const [batchIndex, setBatchIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);

  const total = questions.length;
  const currentBatch = batches[batchIndex] ?? [];
  const hasNextBatch = batchIndex + 1 < batches.length;
  const isLastBatch = batchIndex === batches.length - 1;

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const nextResults: Record<string, boolean> = { ...results };
    currentBatch.forEach((q) => {
      nextResults[q.id] = isCorrect(q, answers[q.id] ?? "");
    });
    setResults(nextResults);
    setSubmitted(true);
  };

  const handleNextGroup = () => {
    if (isLastBatch) {
      setShowSummary(true);
    } else {
      setBatchIndex((i) => i + 1);
      setSubmitted(false);
    }
  };

  const handleRestart = () => {
    setBatchIndex(0);
    setSubmitted(false);
    setAnswers({});
    setResults({});
    setShowSummary(false);
  };

  if (total === 0) {
    return (
      <div>
        <p className="page-desc">本模块暂无题目。</p>
        {onBackToIntro && (
          <button type="button" className="btn btn-secondary" onClick={onBackToIntro} style={{ marginRight: "0.5rem" }}>
            {backButtonLabel ?? "返回介绍"}
          </button>
        )}
        <Link href={`/layer/${layerId}`} className="btn btn-secondary" prefetch={false}>
          返回模块列表
        </Link>
      </div>
    );
  }

  const completedRef = useRef(false);
  useEffect(() => {
    if (showSummary && onPracticeComplete && !completedRef.current) {
      completedRef.current = true;
      const correctCount = Object.values(results).filter(Boolean).length;
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      onPracticeComplete({ correctCount, total, accuracy });
    }
  }, [showSummary, onPracticeComplete, results, total]);

  if (showSummary) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const levelScore = accuracy; // score = accuracy (0–100)
    const isLevelMode = !!onPracticeComplete;
    const isHighScore = accuracy >= 90;

    return (
      <div className={`summary-block ${isLevelMode ? "summary-level" : ""}`}>
        {isLevelMode && (
          <p className={`summary-header ${isHighScore ? "summary-celebration" : "summary-encourage"}`}>
            {isHighScore ? "🎉 太棒了！继续加油！" : "💪 下次一定能做得更好！"}
          </p>
        )}
        <h2 className="summary-title">
          {practiceMode === "example" ? "示例练习总结" : "练习总结"}
        </h2>
        <dl className="summary-stats">
          <dt>总题数</dt>
          <dd>{total}</dd>
          <dt>答对题数</dt>
          <dd>{correctCount}</dd>
          <dt>正确率</dt>
          <dd>{accuracy}%</dd>
          {onPracticeComplete && (
            <>
              <dt>得分</dt>
              <dd className="summary-score">{levelScore}</dd>
            </>
          )}
        </dl>
        <div className="summary-actions">
          {onBackToIntro && (
            <button type="button" className="btn btn-secondary" onClick={onBackToIntro}>
              {backButtonLabel ?? "返回介绍"}
            </button>
          )}
          <button type="button" className="btn" onClick={handleRestart}>
            再练一次
          </button>
          <Link href={`/layer/${layerId}`} className="btn btn-secondary" prefetch={false}>
            返回模块列表
          </Link>
        </div>
      </div>
    );
  }

  const startNum = batchIndex * batchSize + 1;
  const endNum = Math.min((batchIndex + 1) * batchSize, total);

  return (
    <div className="practice-session">
      <div className="practice-nav">
        <span className="question-counter">
          第 {startNum}–{endNum} 题 / 共 {total} 题
        </span>
      </div>

      <section className="questions-section">
        {currentBatch.map((q) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(value) => setAnswer(q.id, value)}
            submittedResult={submitted ? { correct: results[q.id] ?? false } : undefined}
            hideCheckButton
          />
        ))}
      </section>

      {!submitted ? (
        <div className="practice-submit">
          <button
            type="button"
            className="btn"
            onClick={handleSubmit}
          >
            提交答案
          </button>
        </div>
      ) : (
        <div className="practice-next">
          <button type="button" className="btn" onClick={handleNextGroup}>
            {isLastBatch ? "完成并查看总结" : "下一组题"}
          </button>
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        {onBackToIntro && (
          <button type="button" className="btn btn-secondary" onClick={onBackToIntro} style={{ marginRight: "0.5rem" }}>
            {backButtonLabel ?? "返回介绍"}
          </button>
        )}
        <Link href={`/layer/${layerId}`} className="btn btn-secondary" prefetch={false}>
          返回模块列表
        </Link>
      </p>
    </div>
  );
}
