"use client";

import { useState, useEffect, useRef } from "react";
import type {
  ChooseOneGuidedBlock,
  MatchPairsGuidedBlock,
  QuickCheckGuidedBlock,
} from "@/types/guide";
import { answersMatch } from "@/lib/answerUtils";

type GuidedBlock =
  | ChooseOneGuidedBlock
  | MatchPairsGuidedBlock
  | QuickCheckGuidedBlock;

interface Props {
  block: GuidedBlock;
  /** Called once when the exercise is answered correctly (intro pages only). */
  onCorrect?: () => void;
}

export function GuidedActivity({ block, onCorrect }: Props) {
  if (block.activity_type === "choose_one") {
    return <ChooseOneActivity block={block} onCorrect={onCorrect} />;
  }
  if (block.activity_type === "match_pairs") {
    return <MatchPairsActivity block={block} onCorrect={onCorrect} />;
  }
  if (block.activity_type === "quick_check") {
    return <QuickCheckActivity block={block} onCorrect={onCorrect} />;
  }
  return null;
}

function ChooseOneActivity({ block, onCorrect }: { block: ChooseOneGuidedBlock; onCorrect?: () => void }) {
  const [selected, setSelected] = useState("");
  const feedback = selected ? (answersMatch(selected, block.answer) ? "correct" : "wrong") : null;
  const calledRef = useRef(false);
  useEffect(() => {
    if (feedback === "correct" && onCorrect && !calledRef.current) {
      calledRef.current = true;
      onCorrect();
    }
  }, [feedback, onCorrect]);

  return (
    <div className="guided-activity guided-choose-one guided-instant">
      <p className="guided-instruction">{block.instruction_zh}</p>
      <p className="guided-prompt">
        <span className="guided-prompt-en">{block.prompt_en}</span>
        <span className="guided-options-inline">
          {block.options.map((opt) => {
            const isSelected = selected === opt;
            const optFeedback = isSelected ? feedback : null;
            return (
              <label
                key={opt}
                className={`guided-option-inline ${optFeedback ? `guided-option-${optFeedback}` : ""}`}
              >
                <input
                  type="radio"
                  name={`choose-${block.prompt_en}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => setSelected(opt)}
                />
                <span>{opt}</span>
                {optFeedback === "correct" && <span className="guided-check">✓</span>}
              </label>
            );
          })}
        </span>
      </p>
    </div>
  );
}

function MatchPairsActivity({ block, onCorrect }: { block: MatchPairsGuidedBlock; onCorrect?: () => void }) {
  const [selections, setSelections] = useState<Record<number, string>>({});
  const calledRef = useRef(false);
  const allCorrect = block.items.every((item, i) => answersMatch(selections[i] ?? "", item.answer));
  const hasAllSelections = block.items.every((_, i) => (selections[i] ?? "").trim() !== "");

  useEffect(() => {
    if (allCorrect && hasAllSelections && onCorrect && !calledRef.current) {
      calledRef.current = true;
      onCorrect();
    }
  }, [allCorrect, hasAllSelections, onCorrect]);

  return (
    <div className="guided-activity guided-match-pairs guided-instant">
      <p className="guided-instruction">{block.instruction_zh}</p>
      <ul className="guided-match-list">
        {block.items.map((item, index) => {
          const selected = selections[index] ?? "";
          const feedback = selected
            ? answersMatch(selected, item.answer)
              ? "correct"
              : "wrong"
            : null;
          return (
            <li key={index} className="guided-match-item">
              <span className="guided-prompt-en">{item.prompt_en}</span>
              <span className="guided-prompt-arrow">→</span>
              <span className="guided-options-inline">
                {item.options.map((opt) => {
                  const isSelected = selected === opt;
                  const optFeedback = isSelected ? feedback : null;
                  return (
                    <label
                      key={opt}
                      className={`guided-option-inline ${optFeedback ? `guided-option-${optFeedback}` : ""}`}
                    >
                      <input
                        type="radio"
                        name={`match-${index}-${item.prompt_en}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() =>
                          setSelections((prev) => ({ ...prev, [index]: opt }))
                        }
                      />
                      <span>{opt}</span>
                      {optFeedback === "correct" && (
                        <span className="guided-check">✓</span>
                      )}
                    </label>
                  );
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function QuickCheckActivity({ block, onCorrect }: { block: QuickCheckGuidedBlock; onCorrect?: () => void }) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, "correct" | "wrong" | null>>({});
  const calledRef = useRef(false);
  const allCorrect = block.items.every((_, i) => feedback[i] === "correct");

  useEffect(() => {
    if (allCorrect && onCorrect && !calledRef.current) {
      calledRef.current = true;
      onCorrect();
    }
  }, [allCorrect, onCorrect]);

  const handleBlur = (index: number) => {
    const item = block.items[index];
    const value = values[index] ?? "";
    if (!value.trim()) return;
    setFeedback((prev) => ({
      ...prev,
      [index]: answersMatch(value, item.answer) ? "correct" : "wrong",
    }));
  };

  const setValue = (index: number, value: string) => {
    setValues((prev) => ({ ...prev, [index]: value }));
    setFeedback((prev) => ({ ...prev, [index]: null }));
  };

  return (
    <div className="guided-activity guided-quick-check guided-instant">
      <p className="guided-instruction">{block.instruction_zh}</p>
      <ul className="guided-match-list">
        {block.items.map((item, index) => {
          const fb = feedback[index];
          const isChecked = fb !== null && fb !== undefined;
          return (
            <li key={index} className="guided-match-item">
              <span className="guided-prompt-en">{item.prompt_en}</span>
              <span className="guided-prompt-arrow">→</span>
              <input
                type="text"
                className={`guided-input ${fb ? `guided-input-${fb}` : ""}`}
                value={values[index] ?? ""}
                onChange={(e) => setValue(index, e.target.value)}
                onBlur={() => handleBlur(index)}
                placeholder="输入答案"
                disabled={isChecked && fb === "correct"}
                aria-label={`${item.prompt_en}`}
              />
              {fb === "correct" && <span className="guided-check">✓</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
