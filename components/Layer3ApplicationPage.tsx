"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type {
  Layer3ApplicationContent,
  Layer3Question,
  Layer3Section,
} from "@/types/layer3Application";
import { scoreToStars } from "@/lib/moduleProgress";

import styles from "./Layer3ApplicationPage.module.css";

interface Props {
  content: Layer3ApplicationContent;
  onComplete: (score: number, stars: number) => void;
  onBackToMap: () => void;
  /** Optional label for back button. Default: "返回进度图". */
  backButtonLabel?: string;
}

export function Layer3ApplicationPage({
  content,
  onComplete,
  onBackToMap,
  backButtonLabel = "返回进度图",
}: Props) {
  const allQuestions = useMemo(
    () => content.sections.flatMap((s) => s.questions),
    [content.sections]
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);

  const isCorrect = useCallback((q: Layer3Question, value: string): boolean => {
    const raw = typeof value === "string" ? value : String(value ?? "");
    const normalize = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ");
    const normalized = normalize(raw);
    if (!normalized) return false;
    const answer = normalize(q.answer ?? "");
    if (!answer) return false;
    if (normalized === answer) return true;
    if ("acceptable_answers" in q && Array.isArray(q.acceptable_answers)) {
      return q.acceptable_answers.some(
        (a) => normalize(String(a ?? "")) === normalized
      );
    }
    return false;
  }, []);

  const results = useMemo(() => {
    const out: Record<string, boolean> = {};
    allQuestions.forEach((q) => {
      const v = values[q.id];
      if (submitted[q.id] && v !== undefined) {
        out[q.id] = isCorrect(q, v);
      }
    });
    return out;
  }, [allQuestions, values, submitted, isCorrect]);

  const totalCorrect = Object.values(results).filter(Boolean).length;
  const totalQuestions = allQuestions.length;
  const allSubmitted = allQuestions.every((q) => submitted[q.id]);
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const stars = scoreToStars(score);

  const handleSubmitSection = useCallback(() => {
    const nextSubmitted: Record<string, boolean> = {};
    content.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        nextSubmitted[q.id] = true;
      });
    });
    setSubmitted(nextSubmitted);
  }, [content.sections]);

  const handleShowSummary = useCallback(() => {
    setShowSummary(true);
    onComplete(score, stars);
  }, [score, stars, onComplete]);

  if (showSummary) {
    return (
      <div className={styles.page}>
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>{content.summary_card.title_zh}</h2>
          <p className={styles.summaryBody}>{content.summary_card.body_zh}</p>
          <dl className={styles.summaryStats}>
            <dt>正确题数</dt>
            <dd>{totalCorrect} / {totalQuestions}</dd>
            <dt>得分</dt>
            <dd className={styles.summaryScore}>{score}%</dd>
          </dl>
          <button type="button" className={styles.btn} onClick={onBackToMap}>
            返回进度图
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>综合练习 · {content.moduleName_zh}</h1>
        <p className={styles.goal}>{content.learning_goal_zh}</p>
      </header>

      <div className={styles.reminder}>
        <h3 className={styles.reminderTitle}>要点提示</h3>
        <ul className={styles.reminderList}>
          {content.quick_reminder_zh.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {content.sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          values={values}
          setValues={setValues}
          submitted={submitted}
          isCorrect={isCorrect}
        />
      ))}

      <footer className={styles.footer}>
        {allSubmitted ? (
          <button type="button" className={styles.btn} onClick={handleShowSummary}>
            查看小结
          </button>
        ) : (
          <button type="button" className={styles.btn} onClick={handleSubmitSection}>
            提交并查看反馈
          </button>
        )}
        <button type="button" className={styles.btnSecondary} onClick={onBackToMap}>
          {backButtonLabel}
        </button>
      </footer>
    </div>
  );
}

function SectionCard({
  section,
  values,
  setValues,
  submitted,
  isCorrect,
}: {
  section: Layer3Section;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submitted: Record<string, boolean>;
  isCorrect: (q: Layer3Question, value: string) => boolean;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{section.title_zh}</h2>
      {section.description_zh && (
        <p className={styles.sectionDesc}>{section.description_zh}</p>
      )}
      <div className={styles.questions}>
        {section.questions.map((q) =>
          q.type === "listening_backbone" ? (
            <ListeningBackboneBlock
              key={q.id}
              question={q}
              value={values[q.id] ?? ""}
              onChange={(v) => setValues((prev) => ({ ...prev, [q.id]: v }))}
              submitted={submitted[q.id]}
              correct={submitted[q.id] ? isCorrect(q, values[q.id] ?? "") : undefined}
            />
          ) : (
            <QuestionBlock
              key={q.id}
              question={q}
              value={values[q.id] ?? ""}
              onChange={(v) => setValues((prev) => ({ ...prev, [q.id]: v }))}
              submitted={submitted[q.id]}
              correct={submitted[q.id] ? isCorrect(q, values[q.id] ?? "") : undefined}
            />
          )
        )}
      </div>
    </section>
  );
}

function ListeningBackboneBlock({
  question,
  value,
  onChange,
  submitted,
  correct,
}: {
  question: Extract<Layer3Question, { type: "listening_backbone" }>;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  correct?: boolean;
}) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(question.prompt_en);
    u.lang = "en-US";
    u.rate = 0.9;
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setHasPlayed(true);
  }, [question.prompt_en]);

  return (
    <div className={styles.questionBlock}>
      <p className={styles.cue}>{question.instruction_zh}</p>
      <div className={styles.audioControls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={speak}
          disabled={submitted}
          aria-label="播放"
        >
          {hasPlayed ? "🔁 重播" : "▶ 播放"}
        </button>
      </div>
      {!submitted && (
        <p className={styles.listenHint}>（听句子后从下方选择主干，答题前不显示原文）</p>
      )}
      <ul className={styles.options}>
        {question.options.map((opt) => (
          <li key={opt}>
            <label className={styles.option}>
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={submitted}
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      {submitted && (
        <div className={styles.feedback}>
          <p className={styles.transcriptLabel}>完整句子：</p>
          <p className={styles.prompt}>{question.prompt_en}</p>
          <p className={correct ? styles.feedbackCorrect : styles.feedbackWrong}>
            {correct ? "✓ 正确" : "✗ 不正确"}
          </p>
          {!correct && value.trim() && (
            <p className={styles.yourAnswer}>您的选择：{value}</p>
          )}
          {!correct && <p className={styles.correctAnswer}>正确答案：{question.answer}</p>}
          <p className={styles.explanation}>{question.explanation_zh}</p>
        </div>
      )}
    </div>
  );
}

function QuestionBlock({
  question,
  value,
  onChange,
  submitted,
  correct,
}: {
  question: Layer3Question;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  correct?: boolean;
}) {
  const hasOptions =
    question.type === "fill_choice" ||
    question.type === "sentence_choice" ||
    (question.type === "guided_completion" && question.options?.length);

  return (
    <div className={styles.questionBlock}>
      {(question.instruction_zh || (question.type === "guided_completion" && question.cue_zh)) && (
        <p className={styles.cue}>{question.instruction_zh ?? question.cue_zh}</p>
      )}
      {question.prompt_en && (
        <p className={styles.prompt}>{question.prompt_en}</p>
      )}
      {question.hint_zh && (
        <p className={styles.hint}>提示：{question.hint_zh}</p>
      )}
      {hasOptions && question.options && (
        <ul className={styles.options}>
          {question.options.map((opt) => (
            <li key={opt}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  disabled={submitted}
                />
                <span>{opt}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {question.type === "sentence_correction" && (
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入合并后的句子"
          disabled={submitted}
        />
      )}
      {submitted && (
        <div className={styles.feedback}>
          <p className={correct ? styles.feedbackCorrect : styles.feedbackWrong}>
            {correct ? "✓ 正确" : "✗ 不正确"}
          </p>
          {!correct && value.trim() && (
            <p className={styles.yourAnswer}>
              {question.type === "sentence_correction" ? "您的答案：" : "您的选择："}
              {value}
            </p>
          )}
          {!correct && (
            <p className={styles.correctAnswer}>正确答案：{question.answer}</p>
          )}
          <p className={styles.explanation}>{question.explanation_zh}</p>
          {question.wrong_note_zh && !correct && (
            <p className={styles.wrongNote}>{question.wrong_note_zh}</p>
          )}
        </div>
      )}
    </div>
  );
}
