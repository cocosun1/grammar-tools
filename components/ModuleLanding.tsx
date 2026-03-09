"use client";

import { useState, useEffect } from "react";
import type { ModuleGuide } from "@/types/guide";
import { hasSeenIntro, markIntroSeen } from "@/lib/moduleProgress";

interface Props {
  guide: ModuleGuide;
  moduleId: number;
  onGoToIntro: () => void;
  onGoToPractice: () => void;
}

export function ModuleLanding({
  guide,
  moduleId,
  onGoToIntro,
  onGoToPractice,
}: Props) {
  const [seenIntro, setSeenIntro] = useState(false);

  useEffect(() => {
    setSeenIntro(hasSeenIntro(moduleId));
  }, [moduleId]);

  const title = guide.title ?? guide.name_zh;

  const handleGoToIntro = () => {
    markIntroSeen(moduleId);
    setSeenIntro(true);
    onGoToIntro();
  };

  return (
    <div className="module-landing">
      <h1 className="module-landing-title">{title}</h1>
      {guide.overview_zh && (
        <p className="module-landing-overview">{guide.overview_zh}</p>
      )}
      <div className="module-landing-actions">
        <button
          type="button"
          className="btn btn-cta btn-cta-primary"
          onClick={handleGoToIntro}
        >
          📖 知识点学习
        </button>
        <button
          type="button"
          className={`btn btn-cta btn-cta-secondary ${!seenIntro ? "btn-locked" : ""}`}
          onClick={seenIntro ? onGoToPractice : undefined}
          disabled={!seenIntro}
          title={!seenIntro ? "请先完成知识点学习" : undefined}
        >
          {seenIntro ? "🚀 开始练习" : "🔒 开始练习"}
        </button>
      </div>
      {!seenIntro && (
        <p className="module-landing-hint">
          请先点击「知识点学习」完成教程，即可解锁练习
        </p>
      )}
    </div>
  );
}
