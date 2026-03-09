"use client";

import { useState } from "react";
import type { NaturalChoiceQuestion as NaturalChoiceQuestionType } from "@/types/question";

export interface SubmittedResult {
  correct: boolean;
}

interface Props {
  question: NaturalChoiceQuestionType;
  onAnswerCheck?: (correct: boolean) => void;
  value?: string;
  onChange?: (value: string) => void;
  submittedResult?: SubmittedResult;
  hideCheckButton?: boolean;
  hideExplanation?: boolean;
}

export function NaturalChoiceQuestion({
  question,
  onAnswerCheck,
  value: controlledValue,
  onChange: controlledOnChange,
  submittedResult,
  hideCheckButton,
  hideExplanation,
}: Props) {
  const [internalSelected, setInternalSelected] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const isControlled = controlledValue !== undefined && controlledOnChange;
  const selected = isControlled ? (controlledValue ?? "") : internalSelected;
  const setSelected = (v: string) => {
    if (controlledOnChange) controlledOnChange(v);
    else setInternalSelected(v);
    setFeedback(null);
  };

  const handleCheck = () => {
    const correct = selected === question.answer;
    setFeedback(correct ? "correct" : "wrong");
    onAnswerCheck?.(correct);
  };

  const showFeedback = submittedResult !== undefined || feedback !== null;
  const correct = submittedResult !== undefined ? submittedResult.correct : feedback === "correct";

  return (
    <div className="question-block">
      <p className="instruction">{question.instruction_zh}</p>
      <div className="options natural-choice-options">
        {question.options.map((opt, i) => (
          <label key={opt} className="option">
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={selected === opt}
              onChange={() => setSelected(opt)}
              disabled={submittedResult !== undefined}
            />
            <span className="option-label">
              {String.fromCharCode(65 + i)}. {opt}
            </span>
          </label>
        ))}
      </div>
      {submittedResult === undefined && !hideCheckButton && (
        <button
          type="button"
          className="btn"
          onClick={handleCheck}
          disabled={!selected}
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
