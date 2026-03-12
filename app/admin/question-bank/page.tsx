"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/auth";
import { questions } from "@/lib/questions";
import { LAYERS } from "@/types/curriculum";
import layer3ApplicationData from "@/data/layer3Application.json";
import layer3ArgumentData from "@/data/layer3ArgumentData.json";
import level3QuestionsData from "@/data/level3Questions.json";
import type { Layer3ApplicationContentMap } from "@/types/layer3Application";
import type { Layer3ArgumentContentMap } from "@/types/layer3Argument";
import styles from "./question-bank.module.css";

const TYPE_LABELS: Record<string, string> = {
  word_form: "单词形式",
  sentence_correction: "句子改错",
  fill_choice: "填空选择",
  sentence_choice: "句子选择",
  natural_choice: "自然 vs 不自然",
  judgement: "判断",
  guided_completion: "引导产出",
  listening_backbone: "听力主干",
  argument_prompt: "论点题",
};

export type QuestionSource = "questions" | "level3" | "layer3app" | "layer3arg";

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
  layer?: number;
  module?: number;
  _source?: QuestionSource;
  _moduleId?: number;
}

function getQuestionPrompt(q: DisplayQuestion): string {
  return q.prompt_en ?? q.question_en ?? "";
}

function getLayerForModule(moduleId: number): number {
  const layer = LAYERS.find((l) => l.modules.some((m) => m.id === moduleId));
  return layer?.id ?? 1;
}

/** Can edit (questions.json / level3Questions.json only) */
function canEdit(q: DisplayQuestion): boolean {
  return q._source === "questions" || q._source === "level3";
}

/** Can delete or batch-delete (all sources including Layer 3) */
function canDelete(q: DisplayQuestion): boolean {
  return q._source === "questions" || q._source === "level3" || q._source === "layer3app" || q._source === "layer3arg";
}

function findQuestionById(
  grouped: Record<number, Record<number, DisplayQuestion[]>>,
  id: string
): DisplayQuestion | null {
  for (const modMap of Object.values(grouped)) {
    for (const arr of Object.values(modMap)) {
      const q = arr.find((x) => x.id === id);
      if (q) return q;
    }
  }
  return null;
}

export default function QuestionBankPage() {
  const { user } = useAuth();
  const admin = isAdmin(user);

  const [grouped, setGrouped] = useState<Record<number, Record<number, DisplayQuestion[]>>>(() => {
    const byLayer: Record<number, Record<number, DisplayQuestion[]>> = {};

    for (const q of questions) {
      const layerId = q.layer;
      const moduleId = q.module;
      if (!byLayer[layerId]) byLayer[layerId] = {};
      if (!byLayer[layerId][moduleId]) byLayer[layerId][moduleId] = [];
      byLayer[layerId][moduleId].push({
        ...(q as DisplayQuestion),
        _source: "questions",
        _moduleId: moduleId,
      });
    }

    const layer3App = layer3ApplicationData as Layer3ApplicationContentMap;
    const level3Q = level3QuestionsData as Record<string, DisplayQuestion[]>;

    for (const [moduleKey, content] of Object.entries(layer3App)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId)) continue;
      const layerId = getLayerForModule(moduleId);
      if (!byLayer[layerId]) byLayer[layerId] = {};
      if (!byLayer[layerId][moduleId]) byLayer[layerId][moduleId] = [];
      for (const section of content.sections) {
        for (const q of section.questions) {
          byLayer[layerId][moduleId].push({
            id: q.id,
            type: q.type,
            instruction_zh: q.instruction_zh,
            prompt_en: q.prompt_en,
            options: "options" in q ? q.options : undefined,
            answer: q.answer,
            explanation_zh: q.explanation_zh,
            _source: "layer3app",
            _moduleId: moduleId,
          });
        }
      }
    }

    for (const [moduleKey, arr] of Object.entries(level3Q)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId) || !Array.isArray(arr)) continue;
      const layerId = getLayerForModule(moduleId);
      if (!byLayer[layerId]) byLayer[layerId] = {};
      if (!byLayer[layerId][moduleId]) byLayer[layerId][moduleId] = [];
      for (const q of arr) {
        byLayer[layerId][moduleId].push({
          ...q,
          _source: "level3",
          _moduleId: moduleId,
        });
      }
    }

    const layer3Arg = layer3ArgumentData as Layer3ArgumentContentMap;
    for (const [moduleKey, prompts] of Object.entries(layer3Arg)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId) || !Array.isArray(prompts)) continue;
      const layerId = getLayerForModule(moduleId);
      if (!byLayer[layerId]) byLayer[layerId] = {};
      if (!byLayer[layerId][moduleId]) byLayer[layerId][moduleId] = [];
      for (const p of prompts) {
        byLayer[layerId][moduleId].push({
          id: p.id,
          type: "argument_prompt",
          prompt_en: p.prompt_en,
          instruction_zh: `${p.topic} · ${p.questionType.replace(/_/g, " ")}`,
          answer: `一方 ${p.argumentsOneSide.length} 条 / 另一方 ${p.argumentsOtherSide.length} 条`,
          explanation_zh: undefined,
          _source: "layer3arg",
          _moduleId: moduleId,
        });
      }
    }
    return byLayer;
  });

  const [editing, setEditing] = useState<DisplayQuestion | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalCount = useMemo(() => {
    let n = 0;
    for (const modMap of Object.values(grouped)) {
      for (const arr of Object.values(modMap)) {
        n += arr.length;
      }
    }
    return n;
  }, [grouped]);

  const removeQuestion = useCallback((layerId: number, moduleId: number, id: string) => {
    setGrouped((prev) => {
      const next = { ...prev };
      const modMap = { ...next[layerId] };
      modMap[moduleId] = modMap[moduleId].filter((q) => q.id !== id);
      next[layerId] = modMap;
      return next;
    });
  }, []);

  const updateQuestion = useCallback((layerId: number, moduleId: number, id: string, updated: DisplayQuestion) => {
    setGrouped((prev) => {
      const next = { ...prev };
      const modMap = { ...next[layerId] };
      modMap[moduleId] = modMap[moduleId].map((q) =>
        q.id === id ? { ...updated, _source: q._source, _moduleId: q._moduleId } : q
      );
      next[layerId] = modMap;
      return next;
    });
  }, []);

  const toggleSelect = useCallback((q: DisplayQuestion) => {
    if (!canDelete(q)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(
    async () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      if (!confirm(`确定要删除选中的 ${ids.length} 道题目吗？此操作将永久修改数据文件。`)) return;

      const toDelete = ids
        .map((id) => findQuestionById(grouped, id))
        .filter((q): q is DisplayQuestion => q != null && canDelete(q));

      setError(null);
      const failed: string[] = [];
      for (const q of toDelete) {
        try {
          const res = await fetch("/api/admin/questions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: q._source,
              id: q.id,
              moduleId: q._moduleId ?? q.module,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "删除失败");
          removeQuestion(
            getLayerForModule(q._moduleId ?? q.module ?? 0),
            q._moduleId ?? q.module ?? 0,
            q.id
          );
        } catch {
          failed.push(q.id);
        }
      }
      setSelectedIds(new Set());
      if (failed.length > 0) {
        setError(`部分题目删除失败：${failed.join(", ")}`);
      }
    },
    [selectedIds, grouped, removeQuestion]
  );

  const handleDelete = useCallback(
    async (q: DisplayQuestion) => {
      if (!canDelete(q)) return;
      if (!confirm(`确定要删除题目 ${q.id} 吗？此操作将永久修改数据文件。`)) return;
      setError(null);
      try {
        const res = await fetch("/api/admin/questions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: q._source,
            id: q.id,
            moduleId: q._moduleId ?? q.module,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "删除失败");
        removeQuestion(getLayerForModule(q._moduleId ?? q.module ?? 0), q._moduleId ?? q.module ?? 0, q.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除失败");
      }
    },
    [removeQuestion]
  );

  const openEdit = useCallback((q: DisplayQuestion) => {
    if (!canEdit(q)) return;
    setEditing(q);
    setEditForm({
      instruction_zh: q.instruction_zh ?? "",
      question_en: q.question_en ?? "",
      prompt_en: q.prompt_en ?? "",
      answer: q.answer ?? "",
      explanation_zh: q.explanation_zh ?? "",
      options: (q.options ?? []).join("\n"),
    });
    setError(null);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
    setError(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editing || !canEdit(editing)) return;
      const source = editing._source;
      if (source !== "questions" && source !== "level3") return;

      const optionsStr = editForm.options;
      const options = Array.isArray(optionsStr)
        ? optionsStr
        : typeof optionsStr === "string"
          ? optionsStr.split("\n").map((s) => s.trim()).filter(Boolean)
          : [];

      const payload: Record<string, unknown> = {
        instruction_zh: editForm.instruction_zh || undefined,
        answer: editForm.answer || undefined,
        explanation_zh: editForm.explanation_zh || undefined,
      };
      if (editing.type === "word_form") {
        payload.prompt_en = editForm.prompt_en || undefined;
      } else if ("question_en" in editing || editing.type === "fill_choice" || editing.type === "sentence_correction" || editing.type === "judgement") {
        payload.question_en = editForm.question_en || undefined;
      }
      if (editing.prompt_en !== undefined) payload.prompt_en = editForm.prompt_en || undefined;
      if (options.length > 0) payload.options = options;

      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            id: editing.id,
            moduleId: editing._moduleId ?? editing.module,
            question: payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "保存失败");
        updateQuestion(
          getLayerForModule(editing._moduleId ?? editing.module ?? 0),
          editing._moduleId ?? editing.module ?? 0,
          editing.id,
          { ...editing, ...payload, options: options.length > 0 ? options : editing.options }
        );
        closeEdit();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      } finally {
        setSaving(false);
      }
    },
    [editing, editForm, updateQuestion, closeEdit]
  );

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
      <p className={styles.sourceNote}>
        <strong>删除 / 批量删除</strong>适用于所有题目（含 Layer 3 应用与论点题）。<strong>编辑</strong>仅对 <code>questions.json</code> 与 <code>level3Questions.json</code> 的题目可用。
      </p>

      {selectedIds.size > 0 && (
        <div className={styles.batchBar}>
          <span className={styles.batchCount}>已选 {selectedIds.size} 题</span>
          <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleBatchDelete}>
            批量删除
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setSelectedIds(new Set())}
          >
            取消选择
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="关闭">
            ×
          </button>
        </div>
      )}

      {editing && canEdit(editing) && (
        <div className={styles.modalOverlay} onClick={closeEdit}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>编辑题目 {editing.id}</h3>
            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGroup}>
                <label>instruction_zh</label>
                <input
                  type="text"
                  value={editForm.instruction_zh ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, instruction_zh: e.target.value }))}
                />
              </div>
              {(editing.type === "word_form" || editing.prompt_en != null) && (
                <div className={styles.formGroup}>
                  <label>prompt_en</label>
                  <input
                    type="text"
                    value={editForm.prompt_en ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, prompt_en: e.target.value }))}
                  />
                </div>
              )}
              {(editing.type === "fill_choice" || editing.type === "sentence_correction" || editing.type === "judgement" || editing.question_en != null) && (
                <div className={styles.formGroup}>
                  <label>question_en</label>
                  <input
                    type="text"
                    value={editForm.question_en ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, question_en: e.target.value }))}
                  />
                </div>
              )}
              {editing.options != null && (
                <div className={styles.formGroup}>
                  <label>options（每行一个）</label>
                  <textarea
                    rows={4}
                    value={editForm.options ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, options: e.target.value }))}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label>answer</label>
                <input
                  type="text"
                  value={editForm.answer ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, answer: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>explanation_zh</label>
                <input
                  type="text"
                  value={editForm.explanation_zh ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, explanation_zh: e.target.value }))}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>
                  取消
                </button>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? "保存中…" : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Array.from(
        new Set([
          ...LAYERS.filter((l) => !l.isPlaceholder).map((l) => l.id),
          ...Object.keys(grouped).map(Number),
        ])
      )
        .sort((a, b) => a - b)
        .map((layerId) => {
          const layer = LAYERS.find((l) => l.id === layerId);
          const layerName = layer?.name_zh ?? `Layer ${layerId}`;
          const moduleMap = grouped[layerId] ?? {};
          const moduleIds = Array.from(new Set(Object.keys(moduleMap).map(Number))).sort((a, b) => a - b);
          const totalInLayer = moduleIds.reduce(
            (sum, mid) => sum + (moduleMap[mid]?.length ?? 0),
            0
          );

          return (
            <section key={layerId} className={styles.layerSection}>
              <h2 className={styles.layerTitle}>
                Layer {layerId} · {layerName}（{totalInLayer} 题）
              </h2>

              {moduleIds.map((moduleId) => {
                const modQuestions = moduleMap[moduleId] ?? [];
                const layer3App = (layer3ApplicationData as Layer3ApplicationContentMap)[
                  String(moduleId)
                ];
                const moduleInfo = layer?.modules.find((m) => m.id === moduleId);
                const moduleName =
                  layer3App?.moduleName_zh ??
                  (modQuestions[0] as DisplayQuestion)?.module_name_zh ??
                  moduleInfo?.name_zh ??
                  `Module ${moduleId}`;

                return (
                  <details key={moduleId} className={styles.moduleBlock} open={false}>
                    <summary className={styles.moduleSummary}>
                      <span className={styles.moduleName}>{moduleName}</span>
                      <span className={styles.moduleCount}>{modQuestions.length} 题</span>
                    </summary>
                    <ul className={styles.questionList}>
                      {modQuestions.map((q) => (
                        <li key={q.id} className={styles.questionItem}>
                          <div className={styles.questionHeader}>
                            {canDelete(q) && (
                              <input
                                type="checkbox"
                                className={styles.questionCheckbox}
                                checked={selectedIds.has(q.id)}
                                onChange={() => toggleSelect(q)}
                                aria-label={`选择题目 ${q.id}`}
                              />
                            )}
                            <div className={styles.questionMeta}>
                              <span className={styles.questionId}>{q.id}</span>
                              <span className={styles.questionType}>
                                {TYPE_LABELS[q.type] ?? q.type}
                              </span>
                              {q.difficulty != null && (
                                <span className={styles.questionDiff}>难度 {q.difficulty}</span>
                              )}
                            </div>
                            <div className={styles.questionActions}>
                              {canEdit(q) && (
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => openEdit(q)}
                                >
                                  编辑
                                </button>
                              )}
                              {canDelete(q) && (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  onClick={() => handleDelete(q)}
                                >
                                  删除
                                </button>
                              )}
                            </div>
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
