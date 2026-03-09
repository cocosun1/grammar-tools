"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/auth";
import { questions } from "@/lib/questions";
import { LAYERS } from "@/types/curriculum";
import type { Question } from "@/types/question";
import layer3ApplicationData from "@/data/layer3Application.json";
import level3QuestionsData from "@/data/level3Questions.json";
import type { Layer3ApplicationContentMap } from "@/types/layer3Application";
import styles from "./question-bank.module.css";

const TYPE_LABELS: Record<string, string> = {
  word_form: "单词形式",
  sentence_correction: "句子改错",
  fill_choice: "填空选择",
  sentence_choice: "句子选择",
  natural_choice: "自然 vs 不自然",
  judgement: "判断",
  guided_completion: "引导产出",
};

interface DisplayQuestion {
  id: string;
  type: string;
  instruction_zh?: string;
  explanation_zh?: string;
  difficulty?: number;
  question_en?: string;
  prompt_en?: string;
  options?: string[];
  answer: string;
  module_name_zh?: string;
}

function getQuestionPrompt(q: DisplayQuestion): string {
  return q.prompt_en ?? q.question_en ?? "";
}

function getLayerForModule(moduleId: number): number {
  const layer = LAYERS.find((l) => l.modules.some((m) => m.id === moduleId));
  return layer?.id ?? 1;
}

export default function QuestionBankPage() {
  const { user } = useAuth();
  const admin = isAdmin(user);

  const { grouped, totalCount } = useMemo(() => {
    const byLayer: Record<number, Record<number, DisplayQuestion[]>> = {};

    for (const q of questions) {
      const layerId = q.layer;
      const moduleId = q.module;
      if (!byLayer[layerId]) byLayer[layerId] = {};
      if (!byLayer[layerId][moduleId]) byLayer[layerId][moduleId] = [];
      byLayer[layerId][moduleId].push(q as DisplayQuestion);
    }

    const layer3App = layer3ApplicationData as Layer3ApplicationContentMap;
    const level3Q = level3QuestionsData as Record<string, DisplayQuestion[]>;

    for (const [moduleKey, content] of Object.entries(layer3App)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId)) continue;
      const layerId = getLayerForModule(moduleId);
      if (!byLayer[layerId]) byLayer[layerId] = {};
      byLayer[layerId][moduleId] = byLayer[layerId][moduleId] ?? [];
      for (const section of content.sections) {
        for (const q of section.questions) {
          byLayer[layerId][moduleId].push({
            id: q.id,
            type: q.type,
            instruction_zh: q.prompt_en,
            prompt_en: q.prompt_en,
            options: "options" in q ? q.options : undefined,
            answer: q.answer,
            explanation_zh: q.explanation_zh,
          });
        }
      }
    }

    for (const [moduleKey, arr] of Object.entries(level3Q)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId) || !Array.isArray(arr)) continue;
      const layerId = getLayerForModule(moduleId);
      if (!byLayer[layerId]) byLayer[layerId] = {};
      byLayer[layerId][moduleId] = byLayer[layerId][moduleId] ?? [];
      for (const q of arr) {
        byLayer[layerId][moduleId].push({
          id: q.id,
          type: q.type,
          instruction_zh: q.instruction_zh,
          question_en: q.question_en,
          options: q.options,
          answer: q.answer,
          explanation_zh: q.explanation_zh,
          difficulty: q.difficulty,
          module_name_zh: (q as { module_name_zh?: string }).module_name_zh,
        });
      }
    }

    let totalCount = 0;
    for (const modMap of Object.values(byLayer)) {
      for (const arr of Object.values(modMap)) {
        totalCount += arr.length;
      }
    }
    return { grouped: byLayer, totalCount };
  }, []);

  if (!admin) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>题库</h1>
        <p className={styles.denied}>您没有权限访问此页面。</p>
        <Link href="/" className="btn btn-secondary">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span> / 题库</span>
      </nav>
      <h1 className={styles.title}>题库</h1>
      <p className={styles.subtitle}>
        所有题目按层级和模块分组。共 {totalCount} 道题。
      </p>

      {Array.from(new Set([...LAYERS.filter((l) => !l.isPlaceholder).map((l) => l.id), ...Object.keys(grouped).map(Number)])).sort((a, b) => a - b).map((layerId) => {
        const layer = LAYERS.find((l) => l.id === layerId);
        const layerName = layer?.name_zh ?? `Layer ${layerId}`;
        const moduleMap = grouped[layerId] ?? {};
        const moduleIds = Array.from(new Set(Object.keys(moduleMap).map(Number))).sort((a, b) => a - b);
        const totalInLayer = moduleIds.reduce((sum, mid) => sum + (moduleMap[mid]?.length ?? 0), 0);

        return (
          <section key={layerId} className={styles.layerSection}>
            <h2 className={styles.layerTitle}>
              Layer {layerId} · {layerName}（{totalInLayer} 题）
            </h2>

            {moduleIds.map((moduleId) => {
              const modQuestions = moduleMap[moduleId] ?? [];
              const layer3App = (layer3ApplicationData as Layer3ApplicationContentMap)[String(moduleId)];
              const moduleInfo = layer?.modules.find((m) => m.id === moduleId);
              const moduleName =
                layer3App?.moduleName_zh ??
                (modQuestions[0] as { module_name_zh?: string })?.module_name_zh ??
                moduleInfo?.name_zh ??
                `Module ${moduleId}`;

              return (
                <details key={moduleId} className={styles.moduleBlock} open={false}>
                  <summary className={styles.moduleSummary}>
                    <span className={styles.moduleName}>
                      {moduleName}
                    </span>
                    <span className={styles.moduleCount}>{modQuestions.length} 题</span>
                  </summary>
                  <ul className={styles.questionList}>
                    {modQuestions.map((q) => (
                      <li key={q.id} className={styles.questionItem}>
                        <div className={styles.questionMeta}>
                          <span className={styles.questionId}>{q.id}</span>
                          <span className={styles.questionType}>
                            {TYPE_LABELS[q.type] ?? q.type}
                          </span>
                          {q.difficulty != null && (
                            <span className={styles.questionDiff}>难度 {q.difficulty}</span>
                          )}
                        </div>
                        <p className={styles.questionInstruction}>{q.instruction_zh}</p>
                        <p className={styles.questionPrompt}>{getQuestionPrompt(q)}</p>
                        {"options" in q && q.options && q.options.length > 0 && (
                          <ul className={styles.questionOptions}>
                            {q.options.map((opt, i) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        )}
                        <p className={styles.questionAnswer}>
                          <strong>答案：</strong>
                          {q.answer}
                        </p>
                        <p className={styles.questionExplanation}>{q.explanation_zh}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
