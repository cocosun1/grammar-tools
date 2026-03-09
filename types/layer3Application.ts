/**
 * Reusable data structure for Layer 3 "Application" experience.
 * Used when level === 3 and the module has contextual drill, contrast/repair, and guided production.
 */

export type Layer3SectionType = "context_drill" | "contrast_repair" | "guided_production";

export type Layer3QuestionType =
  | "fill_choice"      // choose one option (context)
  | "sentence_choice"  // choose correct sentence (contrast)
  | "sentence_correction" // fix the sentence (repair)
  | "guided_completion"  // complete/rewrite with small output (production)
  | "listening_backbone";  // hear sentence, choose backbone (no transcript until after answer)

export interface Layer3QuestionBase {
  id: string;
  type: Layer3QuestionType;
  /** Instruction in Chinese (题目说明) */
  instruction_zh?: string;
  /** Optional cue for guided_completion (e.g. "Complete with the correct phrase:") */
  cue_zh?: string;
  /** Example sentence or passage in English (句子材料) */
  prompt_en: string;
  /** Short explanation in Chinese (解析) */
  explanation_zh: string;
  /** Optional: why a wrong option is tempting */
  wrong_note_zh?: string;
  /** Optional: hint for what word/connector to use (e.g. "so", "because", "which") */
  hint_zh?: string;
}

export interface Layer3FillChoiceQuestion extends Layer3QuestionBase {
  type: "fill_choice";
  options: string[];
  answer: string;
}

export interface Layer3SentenceChoiceQuestion extends Layer3QuestionBase {
  type: "sentence_choice";
  options: string[];
  answer: string;
}

export interface Layer3SentenceCorrectionQuestion extends Layer3QuestionBase {
  type: "sentence_correction";
  answer: string;
  /** Optional: alternative acceptable answers (e.g. "so" vs "because" variants) */
  acceptable_answers?: string[];
}

export interface Layer3GuidedCompletionQuestion extends Layer3QuestionBase {
  type: "guided_completion";
  /** Cue or instruction (e.g. "Complete with the correct phrase:") */
  cue_zh?: string;
  options?: string[];
  answer: string;
  /** If no options, accept this exact string (or use for display) */
  acceptable_answers?: string[];
}

export interface Layer3ListeningBackboneQuestion extends Layer3QuestionBase {
  type: "listening_backbone";
  /** Full sentence transcript (for TTS and reveal after answer) */
  prompt_en: string;
  options: string[];
  answer: string;
}

export type Layer3Question =
  | Layer3FillChoiceQuestion
  | Layer3SentenceChoiceQuestion
  | Layer3SentenceCorrectionQuestion
  | Layer3GuidedCompletionQuestion
  | Layer3ListeningBackboneQuestion;

export interface Layer3Section {
  id: Layer3SectionType;
  title_zh: string;
  description_zh?: string;
  questions: Layer3Question[];
}

export interface Layer3SummaryCard {
  title_zh: string;
  body_zh: string;
}

export interface Layer3ApplicationContent {
  moduleId: number;
  moduleName_zh: string;
  /** One-line learning goal for this level */
  learning_goal_zh: string;
  /** 2–3 key takeaways (Quick Reminder) */
  quick_reminder_zh: string[];
  sections: Layer3Section[];
  summary_card: Layer3SummaryCard;
}

export type Layer3ApplicationContentMap = Record<string, Layer3ApplicationContent>;
