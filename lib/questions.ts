import type { Question } from "@/types/question";
import questionsData from "@/data/questions.json";
import exampleQuestionsData from "@/data/moduleExamples.json";

export const questions: Question[] = questionsData as Question[];

const exampleQuestions: Question[] = exampleQuestionsData as Question[];

export function getQuestionsByModule(moduleId: number): Question[] {
  return questions.filter((q) => q.module === moduleId);
}

export function getExampleQuestionsByModule(moduleId: number): Question[] {
  return exampleQuestions.filter((q) => q.module === moduleId);
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}
