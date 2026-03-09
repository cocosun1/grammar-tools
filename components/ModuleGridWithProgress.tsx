"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LayerInfo } from "@/types/curriculum";
import { hasSeenIntro, loadModuleProgress } from "@/lib/moduleProgress";

interface Props {
  layer: LayerInfo;
}

function ModuleStatus({
  moduleId,
  layerId,
  name,
  isPlaceholder,
}: {
  moduleId: number;
  layerId: number;
  name: string;
  isPlaceholder: boolean;
}) {
  const [seenIntro, setSeenIntro] = useState(false);
  const [level1Done, setLevel1Done] = useState(false);
  const [level2Done, setLevel2Done] = useState(false);
  const [level3Done, setLevel3Done] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSeenIntro(hasSeenIntro(moduleId));
    const progress = loadModuleProgress(moduleId);
    if (progress?.level1) setLevel1Done(progress.level1.stars >= 1);
    if (progress?.level2) setLevel2Done(progress.level2.stars >= 1);
    if (progress?.level3) setLevel3Done(progress.level3.stars >= 1);
  }, [moduleId]);

  const isGamified = layerId === 1 || layerId === 2 || layerId === 3;

  return (
    <Link
      href={isPlaceholder ? "#" : `/layer/${layerId}/module/${moduleId}`}
      className={`module-box ${isPlaceholder ? "placeholder" : ""}`}
    >
      <span className="module-box-title">{name}</span>
      {!isPlaceholder && (
        <small className="module-box-hint">点击进入</small>
      )}
      {!isPlaceholder && (
        <div className="module-box-status">
          <span className="module-status-item" title="知识点学习">
            📚 {seenIntro ? "✓" : "—"}
          </span>
          {isGamified && (
            <>
              <span className="module-status-item" title="基础练习">L1 {level1Done ? "✓" : "—"}</span>
              <span className="module-status-item" title="速度挑战">L2 {level2Done ? "✓" : "—"}</span>
              <span className="module-status-item" title="语法任务">L3 {level3Done ? "✓" : "—"}</span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}

export function ModuleGridWithProgress({ layer }: Props) {
  return (
    <section className="module-grid">
      {layer.modules.map((mod) => (
        <ModuleStatus
          key={mod.id}
          moduleId={mod.id}
          layerId={layer.id}
          name={mod.name_zh}
          isPlaceholder={!!layer.isPlaceholder}
        />
      ))}
    </section>
  );
}
