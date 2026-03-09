import type { Question } from "@/types/question";
import type {
  Layer3ApplicationContent,
  Layer3Question,
} from "@/types/layer3Application";

/**
 * Converts Layer 3 application questions to the standard Question format
 * so they can be used in Level2Speed (3-minute countdown challenge).
 */
export function layer3QuestionsToQuestions(
  content: Layer3ApplicationContent,
  moduleId: number
): Question[] {
  const moduleName_zh = content.moduleName_zh;
  const base = {
    layer: 3,
    module: moduleId,
    module_name_zh: moduleName_zh,
    difficulty: 1 as const,
  };

  const out: Question[] = [];

  for (const section of content.sections) {
    for (const q of section.questions) {
      if (q.type === "listening_backbone") continue;
      const qq = convertOne(q, base);
      if (qq) out.push(qq);
    }
  }

  return out;
}

function convertOne(
  q: Layer3Question,
  base: { layer: number; module: number; module_name_zh: string; difficulty: 1 }
): Question | null {
  const common = {
    id: q.id,
    ...base,
    instruction_zh: q.instruction_zh ?? q.prompt_en,
    explanation_zh: q.explanation_zh,
  };

  switch (q.type) {
    case "fill_choice":
      return {
        ...common,
        type: "fill_choice",
        question_en: q.prompt_en,
        options: q.options,
        answer: q.answer,
      };

    case "sentence_choice":
      return {
        ...common,
        type: "sentence_choice",
        options: q.options,
        answer: q.answer,
      };

    case "sentence_correction":
      return {
        ...common,
        type: "sentence_correction",
        question_en: q.prompt_en,
        answer: q.answer,
      };

    case "guided_completion":
      if (q.options && q.options.length > 0) {
        return {
          ...common,
          type: "fill_choice",
          question_en: q.prompt_en,
          options: q.options,
          answer: q.answer,
        };
      }
      return {
        ...common,
        type: "sentence_correction",
        question_en: q.prompt_en,
        answer: q.answer,
      };

    default:
      return null;
  }
}
