"use client";

import { useState } from "react";
import type { WordFormQuestion as WordFormQuestionType } from "@/types/question";
import { answersMatch } from "@/lib/answerUtils";

export interface SubmittedResult {
  correct: boolean;
}

interface Props {
  question: WordFormQuestionType;
  onAnswerCheck?: (correct: boolean) => void;
  value?: string;
  onChange?: (value: string) => void;
  submittedResult?: SubmittedResult;
  hideCheckButton?: boolean;
  hideExplanation?: boolean;
}

export function WordFormQuestion({
  question,
  onAnswerCheck,
  value: controlledValue,
  onChange: controlledOnChange,
  submittedResult,
  hideCheckButton,
  hideExplanation,
}: Props) {
  const [internalValue, setInternalValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const isControlled = controlledValue !== undefined && controlledOnChange;
  const value = isControlled ? (controlledValue ?? "") : internalValue;
  const setValue = (v: string) => {
    if (controlledOnChange) controlledOnChange(v);
    else setInternalValue(v);
    setFeedback(null);
  };

  const handleCheck = () => {
    const correct = answersMatch(value, question.answer);
    setFeedback(correct ? "correct" : "wrong");
    onAnswerCheck?.(correct);
  };

  const showFeedback = submittedResult !== undefined || feedback !== null;
  const correct = submittedResult !== undefined ? submittedResult.correct : feedback === "correct";

  return (
    <div className="question-block">
      <p className="instruction">{question.instruction_zh}</p>
      <p className="question-en">
        <span className="prompt-word">{question.prompt_en}</span>
        {" → "}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入复数形式"
          aria-label="答案"
          disabled={submittedResult !== undefined}
          readOnly={submittedResult !== undefined}
        />
      </p>
      {submittedResult === undefined && !hideCheckButton && (
        <button type="button" className="btn" onClick={handleCheck}>
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
