"use client";

import { useMemo } from "react";
import type { ModuleProgress } from "@/lib/moduleProgress";
import { L2_UNLOCK_SCORE } from "@/lib/moduleProgress";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/auth";

interface Props {
  moduleId: number;
  moduleName: string;
  layerId?: string;
  progress: ModuleProgress | null;
  onSelectLevel: (level: 1 | 2 | 3) => void;
  onBackToIntro: () => void;
}

const LEVELS_BASE: { level: 1 | 2 | 3; name: string }[] = [
  { level: 1, name: "基础练习" },
  { level: 2, name: "速度挑战" },
  { level: 3, name: "语法任务" },
];

const LEVELS_LAYER3: { level: 1 | 2 | 3; name: string }[] = [
  { level: 1, name: "综合练习" },
  { level: 2, name: "速度挑战" },
  { level: 3, name: "应用任务" },
];

/** Module 28: single level, synonym replacement practice */
const LEVELS_LAYER3_SYNONYM: { level: 1 | 2 | 3; name: string }[] = [
  { level: 1, name: "同义替换练习" },
];

/** Module 29: single ungraded practice, no levels 2/3 or scores */
const LEVELS_LAYER3_ARGUMENT: { level: 1 | 2 | 3; name: string }[] = [
  { level: 1, name: "论点练习" },
];

const NUMS = ["①", "②", "③"];

function StarsDisplay({ count }: { count: number }) {
  return (
    <span className="level-stars" aria-label={`${count} 星`}>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={`star ${i < count ? "filled" : ""}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function ScoreBadge({ score, level }: { score: number; level: 1 | 2 | 3 }) {
  if (level === 2) return <span className="score-badge">{score} 题</span>;
  if (score >= 100) return <span className="score-badge gold">🥇 {score}%</span>;
  if (score >= 80) return <span className="score-badge silver">🥈 {score}%</span>;
  if (score >= 60) return <span className="score-badge bronze">🥉 {score}%</span>;
  return <span className="score-badge">{score}%</span>;
}

export function ProgressMap({ moduleId, moduleName, layerId, progress, onSelectLevel, onBackToIntro }: Props) {
  const isArgumentModule = layerId === "3" && moduleId === 29;
  const isSynonymModule = layerId === "3" && moduleId === 28;
  const LEVELS =
    isArgumentModule ? LEVELS_LAYER3_ARGUMENT
    : isSynonymModule ? LEVELS_LAYER3_SYNONYM
    : layerId === "3" ? LEVELS_LAYER3
    : LEVELS_BASE;
  const { user } = useAuth();
  const adminUnlockAll = isAdmin(user);

  const levelStates = useMemo(() => {
    if (isArgumentModule) {
      return {
        1: { done: false, unlocked: true, score: undefined as number | undefined, stars: 0 },
        2: { done: false, unlocked: false, score: undefined as number | undefined, stars: 0 },
        3: { done: false, unlocked: false, score: undefined as number | undefined, stars: 0 },
      };
    }
    if (isSynonymModule) {
      const l1 = progress?.level1;
      return {
        1: { done: l1 != null && l1.stars >= 1, unlocked: true, score: l1?.score, stars: l1?.stars ?? 0 },
        2: { done: false, unlocked: false, score: undefined as number | undefined, stars: 0 },
        3: { done: false, unlocked: false, score: undefined as number | undefined, stars: 0 },
      };
    }
    const l1 = progress?.level1;
    const l2 = progress?.level2;
    const l3 = progress?.level3;
    const l1Done = l1 != null && l1.stars >= 1;
    const l2Done = l2 != null && l2.stars >= 1;
    const l3Done = l3 != null && l3.stars >= 1;
    const l2Unlocked = adminUnlockAll || (l1 != null && l1.score >= L2_UNLOCK_SCORE);
    const l3Unlocked = adminUnlockAll || (l1 != null && l1.score >= L2_UNLOCK_SCORE);
    return {
      1: { done: l1Done, unlocked: true, score: l1?.score, stars: l1?.stars ?? 0 },
      2: { done: l2Done, unlocked: l2Unlocked, score: l2?.score, stars: l2?.stars ?? 0 },
      3: { done: l3Done, unlocked: l3Unlocked, score: l3?.score, stars: l3?.stars ?? 0 },
    };
  }, [progress, adminUnlockAll, isArgumentModule]);

  return (
    <div className="progress-map">
      <h2 className="progress-map-title">
        <span className="progress-map-icon">🎮</span> 学习进度
      </h2>
      <p className="progress-map-subtitle">{moduleName}</p>
      <ul className="progress-map-levels">
        {LEVELS.map(({ level, name }) => {
          const state = levelStates[level];
          const locked = !state.unlocked;
          const handleClick = () => {
            if (!locked) onSelectLevel(level);
          };
          return (
            <li key={level} className={`progress-map-level ${locked ? "locked" : ""}`}>
              <button
                type="button"
                className="level-card"
                onClick={handleClick}
                disabled={locked}
                aria-label={locked ? `${name}（已锁定）` : `${name}`}
              >
                <span className="level-num">{NUMS[level - 1]}</span>
                <span className="level-name">{name}</span>
                <span className="level-status">
                  {locked && (
                    <>
                      <span className="status-icon">🔒</span>
                      <span className="unlock-hint">
                        {level === 2 && `需 L1 达 ${L2_UNLOCK_SCORE}% 解锁`}
                        {level === 3 && `需 L1 达 ${L2_UNLOCK_SCORE}% 解锁`}
                      </span>
                    </>
                  )}
                  {!locked && !state.done && !isArgumentModule && <span className="status-icon">🔓</span>}
                  {!locked && state.done && !isArgumentModule && <span className="status-icon">✓</span>}
                  {!isArgumentModule && state.score != null && (
                    <>
                      <span className="status-label">最高分：</span>
                      <ScoreBadge score={state.score} level={level} />
                    </>
                  )}
                  {!isArgumentModule && state.done && (
                    <StarsDisplay count={state.stars} />
                  )}
                  {isArgumentModule && !locked && (
                    <span className="unlock-hint">不评分，仅供练习</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="progress-map-actions">
        <button type="button" className="btn btn-secondary" onClick={onBackToIntro}>
          返回介绍
        </button>
      </div>
    </div>
  );
}
