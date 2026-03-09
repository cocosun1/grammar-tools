export type QuestionType =
  | "word_form"
  | "sentence_correction"
  | "fill_choice"
  | "sentence_choice"
  | "natural_choice"
  | "judgement";

export type Difficulty = 1 | 2 | 3;

export interface BaseQuestion {
  id: string;
  layer: number;
  module: number;
  module_name_zh: string;
  type: QuestionType;
  instruction_zh: string;
  explanation_zh: string;
  difficulty: Difficulty;
}

export interface WordFormQuestion extends BaseQuestion {
  type: "word_form";
  prompt_en: string;
  answer: string;
}

export interface SentenceCorrectionQuestion extends BaseQuestion {
  type: "sentence_correction";
  question_en: string;
  answer: string;
}

export interface FillChoiceQuestion extends BaseQuestion {
  type: "fill_choice";
  question_en: string;
  options: string[];
  answer: string;
}

export interface SentenceChoiceQuestion extends BaseQuestion {
  type: "sentence_choice";
  options: string[];
  answer: string;
}

export interface NaturalChoiceQuestion extends BaseQuestion {
  type: "natural_choice";
  /** Two options: one natural, one unnatural (common learner mistake) */
  options: string[];
  /** The natural/correct sentence */
  answer: string;
  /** Explains why the other option is unnatural */
  explanation_zh: string;
}

export interface JudgementQuestion extends BaseQuestion {
  type: "judgement";
  question_en: string;
  options: string[];
  answer: string;
}

export type Question =
  | WordFormQuestion
  | SentenceCorrectionQuestion
  | FillChoiceQuestion
  | SentenceChoiceQuestion
  | NaturalChoiceQuestion
  | JudgementQuestion;
