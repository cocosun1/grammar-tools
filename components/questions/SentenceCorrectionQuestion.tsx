"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { SentenceCorrectionQuestion as SentenceCorrectionQuestionType } from "@/types/question";
import { normalizeAnswer } from "@/lib/answerUtils";

export interface SubmittedResult {
  correct: boolean;
}

interface WrongCorrectPair {
  wrong: string;
  correct: string;
  index: number;
}

/** Find word-level differences between wrong and correct sentences. */
function getWrongCorrectPairs(
  question_en: string,
  answer: string
): WrongCorrectPair[] {
  const wrongWords = question_en.trim().split(/\s+/);
  const correctWords = answer.trim().split(/\s+/);
  const pairs: WrongCorrectPair[] = [];
  const n = Math.min(wrongWords.length, correctWords.length);
  for (let i = 0; i < n; i++) {
    if (normalizeAnswer(wrongWords[i]) !== normalizeAnswer(correctWords[i])) {
      pairs.push({ wrong: wrongWords[i], correct: correctWords[i], index: i });
    }
  }
  return pairs;
}

interface Props {
  question: SentenceCorrectionQuestionType;
  onAnswerCheck?: (correct: boolean) => void;
  value?: string;
  onChange?: (value: string) => void;
  submittedResult?: SubmittedResult;
  hideCheckButton?: boolean;
  hideExplanation?: boolean;
}

export function SentenceCorrectionQuestion({
  question,
  onAnswerCheck,
  onChange,
  submittedResult,
  hideCheckButton,
  hideExplanation,
}: Props) {
  const pairs = useMemo(
    () => getWrongCorrectPairs(question.question_en, question.answer),
    [question.question_en, question.answer]
  );
  const words = useMemo(
    () => question.question_en.trim().split(/\s+/),
    [question.question_en]
  );

  const [identified, setIdentified] = useState<Set<number>>(new Set());
  const [redFlashIndex, setRedFlashIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const pairByIndex = useMemo(
    () => new Map(pairs.map((p) => [p.index, p])),
    [pairs]
  );
  const allIdentified = pairs.length > 0 && pairs.every((p) => identified.has(p.index));
  const allCorrect = pairs.length > 0 && pairs.every(
    (p) => normalizeAnswer(corrections[p.index] ?? "") === normalizeAnswer(p.correct)
  );

  useEffect(() => {
    if (redFlashIndex === null) return;
    const t = setTimeout(() => setRedFlashIndex(null), 400);
    return () => clearTimeout(t);
  }, [redFlashIndex]);

  // Sync full corrected sentence to parent so answersMatch works (parent checks whole sentence)
  useEffect(() => {
    if (allCorrect && onChange) onChange(question.answer);
  }, [allCorrect, onChange, question.answer]);

  const handleWordClick = useCallback(
    (index: number) => {
      if (submittedResult !== undefined) return;
      const p = pairByIndex.get(index);
      if (p) {
        setIdentified((prev) => new Set(prev).add(index));
        setSelectedIndex(index);
        setInputValue(corrections[index] ?? "");
        setFeedback(null);
      } else {
        setRedFlashIndex(index);
      }
    },
    [pairByIndex, corrections, submittedResult]
  );

  const handleCheckWord = useCallback(() => {
    if (selectedIndex == null) return;
    const p = pairByIndex.get(selectedIndex);
    if (!p) return;
    const ok = normalizeAnswer(inputValue) === normalizeAnswer(p.correct);
    setFeedback(ok ? "correct" : "wrong");
    if (ok) {
      setCorrections((prev) => ({ ...prev, [selectedIndex]: inputValue.trim() }));
      setSelectedIndex(null);
      setInputValue("");
    }
  }, [selectedIndex, inputValue, pairByIndex]);

  const handleSubmitAll = useCallback(() => {
    if (allCorrect) {
      setFeedback("correct");
      onAnswerCheck?.(true);
    } else {
      setFeedback("wrong");
    }
  }, [allCorrect, onAnswerCheck]);

  const showFeedback = submittedResult !== undefined || feedback !== null;
  const correct =
    submittedResult !== undefined ? submittedResult.correct : feedback === "correct" || allCorrect;

  // Fallback: if no parsable wrong/correct pairs (e.g. insertion), use simple full-sentence input
  if (pairs.length === 0) {
    return (
      <div className="question-block">
        <p className="instruction">{question.instruction_zh}</p>
        <p className="question-en">{question.question_en}</p>
        <p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入修改后的句子"
            style={{ width: "100%", maxWidth: "100%" }}
            aria-label="答案"
            disabled={submittedResult !== undefined}
          />
        </p>
        {submittedResult === undefined && !hideCheckButton && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              const ok = normalizeAnswer(inputValue) === normalizeAnswer(question.answer);
              setFeedback(ok ? "correct" : "wrong");
              onAnswerCheck?.(ok);
            }}
          >
            检查答案
          </button>
        )}
        {showFeedback && (
          <div className="feedback-block">
            <div className={`feedback ${correct ? "correct" : "wrong"}`}>
              {correct ? "正确！" : "不正确。"}
              {!correct && <span> 正确答案：{question.answer}</span>}
            </div>
            {question.explanation_zh && !hideExplanation && (
              <div className="feedback-explanation">
                <strong>解析：</strong>
                {question.explanation_zh}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="question-block">
      <p className="instruction">{question.instruction_zh}</p>
      <p className="instruction-hint">
        点击句子中的错误词汇，输入正确形式（点击正确词会显示红色提示）
      </p>
      <div className="sentence-words">
        {words.map((w, i) => {
          const p = pairByIndex.get(i);
          const isWrong = !!p;
          const corrected = corrections[i];
          const isCorrected = corrected !== undefined && corrected !== "";
          const isIdentified = identified.has(i);
          const isRedFlash = redFlashIndex === i;
          const displayText = isCorrected ? corrected : w;
          return (
            <span key={i} className="sentence-word-wrap">
              {i > 0 && " "}
              <button
                type="button"
                className={`sentence-word clickable ${isIdentified ? "identified" : ""} ${isCorrected ? "corrected" : ""} ${isRedFlash ? "red-flash" : ""}`}
                onClick={() => handleWordClick(i)}
                disabled={submittedResult !== undefined}
                aria-pressed={isIdentified || isCorrected}
              >
                {displayText}
              </button>
            </span>
          );
        })}
      </div>

      {selectedIndex != null && pairByIndex.has(selectedIndex) && (
        <div className="correction-input-row">
          <label htmlFor="correction-input">
            将「{pairByIndex.get(selectedIndex)!.wrong}」改为：
          </label>
          <input
            id="correction-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckWord()}
            placeholder="输入正确形式"
            autoFocus
          />
          <button type="button" className="btn btn-sm" onClick={handleCheckWord}>
            确认
          </button>
        </div>
      )}

      {submittedResult === undefined && !hideCheckButton && pairs.length > 0 && allIdentified && (
        <button
          type="button"
          className="btn"
          onClick={handleSubmitAll}
          disabled={!allCorrect}
        >
          {allCorrect ? "完成" : `请先修正 ${pairs.filter((p) => normalizeAnswer(corrections[p.index] ?? "") !== normalizeAnswer(p.correct)).length} 处错误`}
        </button>
      )}

      {showFeedback && (
        <div className="feedback-block">
          <div className={`feedback ${correct ? "correct" : "wrong"}`}>
            {correct ? "正确！" : "不正确。"}
            {!correct && submittedResult !== undefined && (
              <span> 正确答案：{question.answer}</span>
            )}
          </div>
          {question.explanation_zh && !hideExplanation && (
            <div className="feedback-explanation">
              <strong>解析：</strong>
              {question.explanation_zh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
