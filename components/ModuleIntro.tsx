"use client";

import { useState, useCallback } from "react";
import type { ModuleGuide, ModuleGuideBlock } from "@/types/guide";
import { GuidedActivity } from "./GuidedActivity";

interface Props {
  guide: ModuleGuide;
  onStartPractice: () => void;
}

function isExplanationBlock(
  block: ModuleGuideBlock
): block is { type: "explanation"; content_zh: string; examples_zh?: string[] } {
  return block.type === "explanation";
}

function isGuidedBlock(
  block: ModuleGuideBlock
): block is Extract<ModuleGuideBlock, { type: "guided" }> {
  return block.type === "guided";
}

/** Groups consecutive [explanation, guided] pairs into rule cards. */
function getRuleCards(blocks: ModuleGuideBlock[]) {
  type Card = {
    explanation: ModuleGuideBlock | null;
    guided: ModuleGuideBlock | null;
  };
  const cards: Card[] = [];
  let i = 0;
  while (i < blocks.length) {
    const current = blocks[i];
    const next = blocks[i + 1];
    if (isExplanationBlock(current) && next && isGuidedBlock(next)) {
      cards.push({ explanation: current, guided: next });
      i += 2;
    } else if (isExplanationBlock(current)) {
      cards.push({ explanation: current, guided: null });
      i += 1;
    } else if (isGuidedBlock(current)) {
      cards.push({ explanation: null, guided: current });
      i += 1;
    } else {
      i += 1;
    }
  }
  return cards;
}

/** Heuristic: decision rules (判断/如何) use 🔎, grammar rules use 📌 */
function getRuleEmoji(sectionTitle: string, sectionIndex: number): string {
  if (sectionTitle.includes("判断") || sectionTitle.includes("如何")) return "🔎";
  return "📌";
}

/** Section header with divider and icon */
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="guide-section-header">
      <span className="guide-section-divider">—</span>
      <span className="guide-section-icon">{icon}</span>
      <h2 className="guide-section-title">{title}</h2>
      <span className="guide-section-divider">—</span>
    </div>
  );
}

interface RuleCardProps {
  card: ReturnType<typeof getRuleCards>[number];
  ruleEmoji: string;
  completed: boolean;
  onComplete: () => void;
}

function RuleCard({ card, ruleEmoji, completed, onComplete }: RuleCardProps) {
  return (
    <section className={`guide-rule-card ${completed ? "guide-rule-card-completed" : ""}`}>
      {completed && (
        <span className="guide-rule-card-badge" aria-hidden>✓</span>
      )}
      {card.explanation && isExplanationBlock(card.explanation) && (
        <div className="guide-rule-content">
          <p className="guide-explanation-text">
            <span className="guide-emoji-anchor">{ruleEmoji}</span>{" "}
            {card.explanation.content_zh}
          </p>
          {card.explanation.examples_zh && card.explanation.examples_zh.length > 0 && (
            <div className="guide-examples-box">
              <span className="guide-examples-label">💡 例子</span>
              <ul className="guide-examples-list">
                {card.explanation.examples_zh.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {card.guided && isGuidedBlock(card.guided) && (
        <div className="guide-rule-practice">
          <span className="guide-emoji-anchor">🎯</span>
          <div className="guide-practice-inner">
            <GuidedActivity block={card.guided} onCorrect={onComplete} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Progress dots at top */
function ProgressIndicator({ total, completed }: { total: number; completed: number }) {
  if (total === 0) return null;
  return (
    <div className="guide-progress" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total} aria-label={`已完成 ${completed} / ${total} 个练习`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`guide-progress-dot ${i < completed ? "completed" : ""}`}
        />
      ))}
    </div>
  );
}

export function ModuleIntro({ guide, onStartPractice }: Props) {
  const useSections = guide.sections && guide.sections.length > 0;
  const title = guide.title ?? guide.name_zh;

  const { flatCards, totalCards } = useSections
    ? (() => {
        const flat: { card: ReturnType<typeof getRuleCards>[number]; sectionTitle: string; sectionIndex: number }[] = [];
        guide.sections!.forEach((section, sectionIndex) => {
          const cards = getRuleCards(section.blocks);
          cards.forEach((card) => {
            flat.push({ card, sectionTitle: section.title_zh, sectionIndex });
          });
        });
        return { flatCards: flat, totalCards: flat.length };
      })()
    : (() => {
        const cards = getRuleCards(guide.blocks);
        return { flatCards: cards.map((card) => ({ card, sectionTitle: "", sectionIndex: 0 })), totalCards: cards.length };
      })();

  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const handleComplete = useCallback((index: number) => {
    setCompleted((prev) => new Set(prev).add(index));
  }, []);

  return (
    <div className="module-intro">
      <ProgressIndicator total={totalCards} completed={completed.size} />
      <h1 className="module-intro-title">{title}</h1>
      {guide.overview_zh && (
        <p className="module-intro-overview">{guide.overview_zh}</p>
      )}
      {useSections ? (
        <div className="guide-sections">
          {guide.sections!.map((section, sectionIndex) => {
            const cards = getRuleCards(section.blocks);
            const ruleEmoji = getRuleEmoji(section.title_zh, sectionIndex);
            const sectionIcon = section.title_zh.includes("判断") || section.title_zh.includes("如何") ? "🔎" : "📌";
            const startIndex = guide.sections!.slice(0, sectionIndex).reduce(
              (acc, s) => acc + getRuleCards(s.blocks).length,
              0
            );

            return (
              <div key={sectionIndex} className="guide-section">
                <SectionHeader title={section.title_zh} icon={sectionIcon} />
                <div className="guide-section-blocks">
                  {cards.map((card, i) => {
                    const globalIndex = startIndex + i;
                    return (
                      <RuleCard
                        key={i}
                        card={card}
                        ruleEmoji={ruleEmoji}
                        completed={completed.has(globalIndex)}
                        onComplete={() => handleComplete(globalIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="guide-blocks">
          {flatCards.map(({ card }, index) => (
            <RuleCard
              key={index}
              card={card}
              ruleEmoji="📌"
              completed={completed.has(index)}
              onComplete={() => handleComplete(index)}
            />
          ))}
        </div>
      )}

      <div className="module-intro-actions">
        <button type="button" className="btn btn-cta" onClick={onStartPractice}>
          <span className="btn-cta-icon">🚀</span>
          开始正式练习
        </button>
      </div>
    </div>
  );
}
