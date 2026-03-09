"use client";

import type { Question } from "@/types/question";
import { WordFormQuestion } from "./questions/WordFormQuestion";
import { SentenceCorrectionQuestion } from "./questions/SentenceCorrectionQuestion";
import { FillChoiceQuestion } from "./questions/FillChoiceQuestion";
import { SentenceChoiceQuestion } from "./questions/SentenceChoiceQuestion";
import { NaturalChoiceQuestion } from "./questions/NaturalChoiceQuestion";
import { JudgementQuestion } from "./questions/JudgementQuestion";

export interface SubmittedResult {
  correct: boolean;
}

interface Props {
  question: Question;
  onAnswerCheck?: (correct: boolean) => void;
  value?: string;
  onChange?: (value: string) => void;
  submittedResult?: SubmittedResult;
  hideCheckButton?: boolean;
  /** When true, do not show explanation_zh (e.g. for speed mode). */
  hideExplanation?: boolean;
}

export function QuestionRenderer({
  question,
  onAnswerCheck,
  value,
  onChange,
  submittedResult,
  hideCheckButton,
  hideExplanation,
}: Props) {
  const common = {
    value,
    onChange,
    submittedResult,
    hideCheckButton,
  };
  switch (question.type) {
    case "word_form":
      return (
        <WordFormQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    case "sentence_correction":
      return (
        <SentenceCorrectionQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    case "fill_choice":
      return (
        <FillChoiceQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    case "sentence_choice":
      return (
        <SentenceChoiceQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    case "natural_choice":
      return (
        <NaturalChoiceQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    case "judgement":
      return (
        <JudgementQuestion
          question={question}
          onAnswerCheck={onAnswerCheck}
          {...common}
          hideExplanation={hideExplanation}
        />
      );
    default:
      return null;
  }
}
