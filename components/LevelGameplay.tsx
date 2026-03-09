"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Question } from "@/types/question";
import { ModulePractice } from "./ModulePractice";
import { QuestionRenderer } from "./QuestionRenderer";
import { answersMatch } from "@/lib/answerUtils";
import { saveModuleProgress, scoreToStars } from "@/lib/moduleProgress";
import { questionSignature, selectBalancedQuestions, selectRandomItems } from "@/lib/randomQuestions";
import level3TasksData from "@/data/level3Tasks.json";
import level3QuestionsData from "@/data/level3Questions.json";
import layer3ApplicationData from "@/data/layer3Application.json";
import layer3ArgumentData from "@/data/layer3ArgumentData.json";
import { Layer3ApplicationPage } from "./Layer3ApplicationPage";
import { Layer3ArgumentPage } from "./Layer3ArgumentPage";
import { layer3QuestionsToQuestions } from "@/lib/layer3ToQuestion";
import type {
  Layer3ApplicationContent,
  Layer3ApplicationContentMap,
} from "@/types/layer3Application";
import type { Layer3ArgumentContentMap } from "@/types/layer3Argument";

const SPEED_LEVEL_SECONDS = 3 * 60; // 3 minutes

export type Level3Item =
  | { kind: "translation"; id: string; prompt_zh: string; grammar_checks: GrammarCheck[] }
  | { kind: "question"; question: Question };

interface GrammarCheck {
  required: string;
  wrong: string | null;
  hint: string;
  /** Alternative acceptable strings (e.g. "no" for "little" when meaning "almost none"). */
  accept_also?: string[];
}

interface TranslationTask {
  id: string;
  prompt_zh: string;
  grammar_checks: GrammarCheck[];
}

interface Props {
  moduleId: number;
  level: 1 | 2 | 3;
  questions: Question[];
  layerId: string;
  layerName: string;
  moduleName: string;
  onBackToMap: () => void;
}

export function LevelGameplay({
  moduleId,
  level,
  questions,
  layerId,
  layerName,
  moduleName,
  onBackToMap,
}: Props) {
  const [phase, setPhase] = useState<"play" | "summary">("play");

  const layer3Content = (layer3ApplicationData as Layer3ApplicationContentMap)[String(moduleId)];
  const isLayer3Module = layerId === "3" && layer3Content;
  const argumentPrompts = (layer3ArgumentData as Layer3ArgumentContentMap)[String(moduleId)];

  if (layerId === "3" && moduleId === 29 && level === 1 && argumentPrompts?.length) {
    return (
      <Layer3ArgumentPage
        prompts={argumentPrompts}
        moduleName_zh={moduleName}
        onBackToMap={onBackToMap}
      />
    );
  }

  if (layerId === "3" && moduleId === 28 && level === 1 && layer3Content) {
    return (
      <Layer3ApplicationPage
        content={layer3Content}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 1, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  if (isLayer3Module && level === 1) {
    const mixed = useMemo(() => {
      const all = layer3Content.sections.flatMap((s) => s.questions);
      const filtered = all.filter((q) => q.type !== "sentence_correction");
      const pool = filtered.length > 0 ? filtered : all;
      return selectRandomItems(pool, Math.min(10, pool.length));
    }, [layer3Content]);
    const firstSection = layer3Content.sections[0];
    const sectionTitle = firstSection?.title_zh ?? "基础练习";
    const sectionDesc = firstSection?.description_zh ?? "情境练习、对比与纠错、引导产出的综合练习。";
    const mixedSection = {
      id: "context_drill" as const,
      title_zh: sectionTitle,
      description_zh: sectionDesc,
      questions: mixed,
    };
    const mixedContent: Layer3ApplicationContent = {
      ...layer3Content,
      sections: [mixedSection],
    };
    return (
      <Layer3ApplicationPage
        content={mixedContent}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 1, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  if (isLayer3Module && level === 2) {
    const l3Questions = useMemo(
      () => layer3QuestionsToQuestions(layer3Content, moduleId),
      [layer3Content, moduleId]
    );
    return (
      <Level2Speed
        questions={l3Questions}
        moduleName={layer3Content.moduleName_zh}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 2, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  if (isLayer3Module && level === 3) {
    const selectedItems = useMemo(() => {
      const translations =
        (level3TasksData as Record<string, TranslationTask[]>)[String(moduleId)] ?? [];
      const rawQuestions =
        (level3QuestionsData as Record<string, unknown[]>)[String(moduleId)] ?? [];
      const l3Questions = rawQuestions.map((q: unknown) => ({
        ...(q as Record<string, unknown>),
        layer: 3,
        module: moduleId,
      })) as Question[];
      const items: Level3Item[] = [
        ...translations.map((t) => ({ kind: "translation" as const, ...t })),
        ...l3Questions.map((q) => ({ kind: "question" as const, question: q })),
      ];
      return selectRandomItems(
        items,
        Math.min(10, items.length),
        (item) =>
          item.kind === "question"
            ? questionSignature(item.question)
            : item.id
      );
    }, [moduleId]);
    if (selectedItems.length === 0) {
      const fallbackSection = layer3Content.sections[2];
      if (fallbackSection) {
        const filteredSection = {
          ...fallbackSection,
          questions: fallbackSection.questions.filter(
            (q) => q.type !== "sentence_correction"
          ),
        };
        if (filteredSection.questions.length === 0) return null;
        return (
          <Layer3ApplicationPage
            content={{ ...layer3Content, sections: [filteredSection] }}
            onComplete={(score, stars) => {
              saveModuleProgress(moduleId, 3, { score, stars });
            }}
            onBackToMap={onBackToMap}
          />
        );
      }
      return null;
    }
    return (
      <Level3Task
        items={selectedItems}
        moduleName={layer3Content.moduleName_zh}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 3, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  // Level 1: base practice — 10 random questions, balanced types
  if (level === 1) {
    const selected = useMemo(
      () => selectBalancedQuestions(questions, 10),
      [questions]
    );
    return (
      <Level1Base
        questions={selected}
        layerId={layerId}
        layerName={moduleName}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 1, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  // Level 2: speed challenge — endless random pool, avoid repetition
  if (level === 2) {
    return (
      <Level2Speed
        questions={questions}
        moduleName={moduleName}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 2, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  // Level 3: Module 1 uses the new Application experience; others use translation + questions
  if (level === 3) {
    const appContent = (layer3ApplicationData as Layer3ApplicationContentMap)[String(moduleId)];
    if (appContent) {
      return (
        <Layer3ApplicationPage
          content={appContent}
          onComplete={(score, stars) => {
            saveModuleProgress(moduleId, 3, { score, stars });
          }}
          onBackToMap={onBackToMap}
        />
      );
    }
    const items = useMemo(() => {
      const translations = (level3TasksData as Record<string, TranslationTask[]>)[String(moduleId)] ?? [];
      const rawQuestions = (level3QuestionsData as Record<string, unknown[]>)[String(moduleId)] ?? [];
      const questions = rawQuestions.map((q: unknown) => ({
        ...(q as Record<string, unknown>),
        layer: 1,
        module: moduleId,
      })) as Question[];
      const combined: Level3Item[] = [
        ...translations.map((t) => ({ kind: "translation" as const, ...t })),
        ...questions.map((q) => ({ kind: "question" as const, question: q })),
      ];
      return selectRandomItems(
        combined,
        10,
        (item) =>
          item.kind === "question"
            ? questionSignature(item.question)
            : item.id
      );
    }, [moduleId]);
    return (
      <Level3Task
        items={items}
        moduleName={moduleName}
        onComplete={(score, stars) => {
          saveModuleProgress(moduleId, 3, { score, stars });
        }}
        onBackToMap={onBackToMap}
      />
    );
  }

  return null;
}

function Level1Base({
  questions,
  layerId,
  layerName,
  onComplete,
  onBackToMap,
}: {
  questions: Question[];
  layerId: string;
  layerName: string;
  onComplete: (score: number, stars: number) => void;
  onBackToMap: () => void;
}) {
  const handleComplete = useCallback(
    (result: { correctCount: number; total: number; accuracy: number }) => {
      const score = result.accuracy; // score = accuracy (0–100)
      const stars = scoreToStars(score);
      onComplete(score, stars);
    },
    [onComplete]
  );

  return (
    <ModulePractice
      questions={questions}
      layerId={layerId}
      layerName={layerName}
      moduleName={layerName}
      onBackToIntro={onBackToMap}
      practiceMode="real"
      onPracticeComplete={handleComplete}
      backButtonLabel="返回进度图"
      batchSize={10}
    />
  );
}

function Level2Speed({
  questions,
  onComplete,
  onBackToMap,
}: {
  questions: Question[];
  moduleName: string;
  onComplete: (score: number, stars: number) => void;
  onBackToMap: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(SPEED_LEVEL_SECONDS);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const completedRef = useRef(false);
  const poolRef = useRef<Question[]>([]);
  const poolIndexRef = useRef(0);

  const getNextQuestion = useCallback((): Question | null => {
    if (questions.length === 0) return null;
    if (poolRef.current.length === 0 || poolIndexRef.current >= poolRef.current.length) {
      poolRef.current = selectBalancedQuestions(questions, questions.length);
      poolIndexRef.current = 0;
    }
    const q = poolRef.current[poolIndexRef.current];
    poolIndexRef.current++;
    return q ?? null;
  }, [questions]);

  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  useEffect(() => {
    setCurrentQ(getNextQuestion());
  }, [getNextQuestion]);

  useEffect(() => {
    if (showSummary && !completedRef.current) {
      completedRef.current = true;
      const correctCount = Object.values(results).filter(Boolean).length;
      const score = correctCount; // L2: 正确的个数
      const stars = scoreToStars(score, 2);
      onComplete(score, stars);
    }
  }, [showSummary, results, onComplete]);

  useEffect(() => {
    if (showSummary) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setShowSummary(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [showSummary]);

  const handleSubmit = useCallback(() => {
    if (!currentQ) return;
    const correct = answersMatch(answers[currentQ.id] ?? "", currentQ.answer);
    setResults((prev) => ({ ...prev, [currentQ.id]: correct }));
    setSubmitted(true);
  }, [currentQ, answers]);

  const handleNext = useCallback(() => {
    const next = getNextQuestion();
    if (next) {
      setCurrentQ(next);
      setSubmitted(false);
    }
  }, [getNextQuestion]);

  useEffect(() => {
    if (!submitted || !currentQ) return;
    const id = setTimeout(() => handleNext(), 700);
    return () => clearTimeout(id);
  }, [submitted, currentQ?.id, handleNext]);

  if (showSummary) {
    const attempted = Object.keys(results).length;
    const correctCount = Object.values(results).filter(Boolean).length;
    const score = correctCount;

    return (
      <div className="summary-block level-summary">
        <h2 className="summary-title">速度挑战结束</h2>
        <dl className="summary-stats">
          <dt>作答题数</dt>
          <dd>{attempted}</dd>
          <dt>答对题数</dt>
          <dd>{correctCount}</dd>
          <dt>得分（正确个数）</dt>
          <dd className="summary-score">{score}</dd>
        </dl>
        <div className="summary-actions">
          <button type="button" className="btn" onClick={onBackToMap}>
            返回进度图
          </button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="practice-session level-speed">
      <div className="practice-nav level-speed-nav">
        <span className="timer">
          ⏱ {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <span className="question-counter">
          第 {Object.keys(results).length + (currentQ && !submitted ? 1 : 0)} 题
        </span>
      </div>
      {currentQ && (
        <section
          className={`questions-section level-speed-question ${submitted ? `flash-${results[currentQ.id] ? "correct" : "wrong"}` : ""}`}
        >
          <QuestionRenderer
            key={currentQ.id}
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [currentQ.id]: v }))}
            submittedResult={submitted ? { correct: results[currentQ.id] ?? false } : undefined}
            hideCheckButton
            hideExplanation
          />
        </section>
      )}
      {!submitted && (
        <div className="practice-submit">
          <button type="button" className="btn" onClick={handleSubmit}>
            提交
          </button>
        </div>
      )}
    </div>
  );
}

function Level3Task({
  items,
  moduleName,
  onComplete,
  onBackToMap,
}: {
  items: Level3Item[];
  moduleName: string;
  onComplete: (score: number, stars: number) => void;
  onBackToMap: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, { passed: number; total: number; hints: string[] }>>({});
  const [showSummary, setShowSummary] = useState(false);
  const item = items[index];

  const checkGrammar = useCallback((text: string, checks: GrammarCheck[]) => {
    const normalized = text.trim().toLowerCase();
    let passed = 0;
    const hints: string[] = [];
    for (const c of checks) {
      const req = c.required.toLowerCase();
      const wrong = c.wrong?.toLowerCase();
      const hasRequired = normalized.includes(req);
      const hasAcceptAlso = (c.accept_also ?? []).some((alt) =>
        normalized.includes(alt.toLowerCase())
      );
      const hasWrong = wrong
        ? new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(normalized)
        : false;
      const satisfied = (hasRequired || hasAcceptAlso) && !hasWrong;
      if (satisfied) {
        passed++;
      } else if (hasWrong) {
        hints.push(c.hint);
      } else if (!hasRequired && !hasAcceptAlso) {
        hints.push(c.hint);
      }
    }
    return { passed, total: checks.length, hints };
  }, []);

  const handleSubmitTranslation = useCallback(() => {
    if (!item || item.kind !== "translation") return;
    const text = values[item.id] ?? "";
    const result = checkGrammar(text, item.grammar_checks);
    setFeedback((prev) => ({ ...prev, [item.id]: result }));
    setSubmitted(true);
  }, [item, values, checkGrammar]);

  const handleQuestionCheck = useCallback((questionId: string, correct: boolean) => {
    setQuestionResults((prev) => ({ ...prev, [questionId]: correct }));
    setSubmitted(true);
  }, []);

  const completedRef = useRef(false);
  useEffect(() => {
    if (showSummary && !completedRef.current) {
      completedRef.current = true;
      const translationPassed = Object.values(feedback).reduce((a, f) => a + f.passed, 0);
      const translationTotal = items
        .filter((i): i is Level3Item & { kind: "translation" } => i.kind === "translation")
        .reduce((a, i) => a + i.grammar_checks.length, 0);
      const questionCorrect = Object.values(questionResults).filter(Boolean).length;
      const questionTotal = items.filter((i) => i.kind === "question").length;
      const totalPassed = translationPassed + questionCorrect;
      const totalChecks = translationTotal + questionTotal;
      const score = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
      const stars = scoreToStars(score);
      onComplete(score, stars);
    }
  }, [showSummary, feedback, questionResults, items, onComplete]);

  const handleNext = useCallback(() => {
    if (index + 1 >= items.length) {
      setShowSummary(true);
    } else {
      setIndex((i) => i + 1);
      setSubmitted(false);
    }
  }, [index, items]);

  if (items.length === 0) {
    return (
      <div>
        <p className="page-desc">本关暂无题目。</p>
        <button type="button" className="btn" onClick={onBackToMap}>
          返回进度图
        </button>
      </div>
    );
  }

  if (showSummary) {
    const translationPassed = Object.values(feedback).reduce((a, f) => a + f.passed, 0);
    const translationTotal = items
      .filter((i): i is Level3Item & { kind: "translation" } => i.kind === "translation")
      .reduce((a, i) => a + i.grammar_checks.length, 0);
    const questionCorrect = Object.values(questionResults).filter(Boolean).length;
    const questionTotal = items.filter((i) => i.kind === "question").length;
    const totalPassed = translationPassed + questionCorrect;
    const totalChecks = translationTotal + questionTotal;
    const score = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0;
    const stars = scoreToStars(score);

    return (
      <div className="summary-block level-summary">
        <h2 className="summary-title">语法任务完成</h2>
        <dl className="summary-stats">
          <dt>正确语法点</dt>
          <dd>{totalPassed} / {totalChecks}</dd>
          <dt>得分（正确率）</dt>
          <dd className="summary-score">{score}%</dd>
        </dl>
        <div className="summary-actions">
          <button type="button" className="btn" onClick={onBackToMap}>
            返回进度图
          </button>
        </div>
      </div>
    );
  }

  const fb = item && item.kind === "translation" ? feedback[item.id] : null;

  return (
    <div className="practice-session level-task">
      <div className="practice-nav">
        <span className="question-counter">
          第 {index + 1} 题 / 共 {items.length} 题
        </span>
      </div>
      {item && item.kind === "translation" && (
        <section className="level-task-question">
          <p className="level-task-prompt">请将以下句子翻译成英语：</p>
          <p className="level-task-zh">{item.prompt_zh}</p>
          <div className="level-task-input-wrap">
            <input
              type="text"
              className="level-task-input"
              value={values[item.id] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
              placeholder="输入英文句子"
              disabled={submitted}
            />
          </div>
          {submitted && fb && (
            <div className="level-task-feedback">
              {fb.hints.length > 0 ? (
                <ul>
                  {fb.hints.map((h, i) => (
                    <li key={i} className="feedback-hint">{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="feedback-correct">✓ 语法正确</p>
              )}
              <p className="feedback-score">
                本句得分：{fb.passed} / {fb.total} 个语法点
              </p>
            </div>
          )}
        </section>
      )}
      {item && item.kind === "question" && (
        <section className="level-task-question">
          <QuestionRenderer
            question={item.question}
            value={values[item.question.id]}
            onChange={(v) => setValues((prev) => ({ ...prev, [item.question.id]: v }))}
            submittedResult={submitted ? { correct: questionResults[item.question.id] ?? false } : undefined}
            onAnswerCheck={(correct) => handleQuestionCheck(item.question.id, correct)}
          />
          {submitted && (
            <p className="feedback-score">
              {questionResults[item.question.id] ? "✓ 正确" : "✗ 不正确"}
            </p>
          )}
        </section>
      )}
      {item && (
        <>
          {!submitted ? (
            item.kind === "translation" ? (
              <div className="practice-submit">
                <button type="button" className="btn" onClick={handleSubmitTranslation}>
                  提交
                </button>
              </div>
            ) : null
          ) : (
            <div className="practice-next">
              <button type="button" className="btn" onClick={handleNext}>
                {index + 1 >= items.length ? "完成" : "下一题"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
