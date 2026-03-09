/**
 * Layer 3 Module 29: Argument Generation Practice (ungraded).
 * Prompts with 1-min timer, then reveal 3–4 arguments per side.
 */

export type ArgumentQuestionType =
  | "agree_disagree"
  | "comparison"
  | "advantages_disadvantages"
  | "explain_phenomenon"
  | "open_ended";

export type ArgumentTopicCategory =
  | "education"
  | "society"
  | "government"
  | "work"
  | "life"
  | "business"
  | "environment"
  | "technology"
  | "media"
  | "culture"
  | "art";

export interface ArgumentPrompt {
  id: string;
  prompt_en: string;
  topic: ArgumentTopicCategory;
  questionType: ArgumentQuestionType;
  /** 3–4 arguments supporting one side (e.g. "agree" or "A") */
  argumentsOneSide: string[];
  /** 3–4 arguments supporting the opposite side */
  argumentsOtherSide: string[];
}

export type Layer3ArgumentContentMap = Record<string, ArgumentPrompt[]>;
