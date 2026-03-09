"use client";

import { useState, useEffect, useMemo } from "react";
import { LAYERS } from "@/types/curriculum";
import { hasSeenIntro, loadModuleProgress } from "@/lib/moduleProgress";

const TOTAL_UNITS = LAYERS.filter((l) => !l.isPlaceholder).reduce((s, l) => s + l.modules.length * 3, 0);

/** Percentage completed = intro + level1 + level2 per module, for all non-placeholder layers. */
export function HomeProgressBar() {
  const [completed, setCompleted] = useState(0);
  const percent = useMemo(() => (TOTAL_UNITS > 0 ? Math.round((completed / TOTAL_UNITS) * 100) : 0), [completed]);

  useEffect(() => {
    let n = 0;
    for (const layer of LAYERS) {
      if (layer.isPlaceholder) continue;
      for (const mod of layer.modules) {
        if (hasSeenIntro(mod.id)) n += 1;
        const progress = loadModuleProgress(mod.id);
        if (progress?.level1 && progress.level1.stars >= 1) n += 1;
        if (progress?.level2 && progress.level2.stars >= 1) n += 1;
      }
    }
    setCompleted(n);
  }, []);

  return (
    <section className="home-progress" aria-label="学习进度">
      <div className="home-progress-header">
        <span className="home-progress-label">学习进度</span>
        <span className="home-progress-value">
          {completed} / {TOTAL_UNITS}（{percent}%）
        </span>
      </div>
      <div className="home-progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`已完成 ${percent}%`}>
        <div className="home-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
