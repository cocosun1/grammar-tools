"use client";

import { useState, useEffect } from "react";
import type { ModuleGuide } from "@/types/guide";
import type { Question } from "@/types/question";
import { ModuleLanding } from "./ModuleLanding";
import { ModuleIntro } from "./ModuleIntro";
import { ModulePractice } from "./ModulePractice";
import { ProgressMap } from "./ProgressMap";
import { LevelGameplay } from "./LevelGameplay";
import { loadModuleProgress, markIntroSeen, hasSeenIntro, L2_UNLOCK_SCORE } from "@/lib/moduleProgress";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import layer3ApplicationData from "@/data/layer3Application.json";
import type { Layer3ApplicationContentMap } from "@/types/layer3Application";
import { Layer3IntroPage } from "./Layer3IntroPage";

type Step = "landing" | "intro" | "map" | "level" | "real";

interface Props {
  moduleId: number;
  moduleGuide: ModuleGuide | null;
  /** Layer 3 intro content passed from server (for modules 24-27). */
  layer3IntroContent?: import("@/types/layer3Intro").Layer3IntroContent | null;
  realQuestions: Question[];
  layerId: string;
  layerName: string;
  moduleName: string;
  /** When set, skip landing/intro/map and go directly to this level (for direct links like ?level=3). */
  initialLevel?: 1 | 2 | 3;
}

export function ModuleFlow({
  moduleId,
  moduleGuide,
  layer3IntroContent,
  realQuestions,
  layerId,
  layerName,
  moduleName,
  initialLevel,
}: Props) {
  const [step, setStep] = useState<Step>(() => {
    const layerNum = Number(layerId);
    const isGamifiedLayer = layerNum === 1 || layerNum === 2 || layerNum === 3;
    const hasIntroContent = moduleGuide &&
      (moduleGuide.blocks.length > 0 || (moduleGuide.sections && moduleGuide.sections.length > 0));
    const layer3App = (layer3ApplicationData as Layer3ApplicationContentMap)[String(moduleId)];
    const hasL3App = layerNum === 3 && !!layer3App;
    const hasLayer3Intro = layerNum === 3 && !!layer3IntroContent;
    if (initialLevel && isGamifiedLayer) {
      if (hasLayer3Intro) {
        const seenIntro = typeof window !== "undefined" && hasSeenIntro(moduleId);
        if (!seenIntro) return "intro";
      }
      if (initialLevel === 2 || initialLevel === 3) {
        const userId = typeof window !== "undefined" ? getCurrentUserId() : null;
        if (isAdmin(userId)) return "level";
        const prog = typeof window !== "undefined" ? loadModuleProgress(moduleId) : null;
        const l1 = prog?.level1;
        if (l1 != null && l1.score >= L2_UNLOCK_SCORE) return "level";
      } else {
        return "level";
      }
    }
    if (hasLayer3Intro) return "intro";
    if (isGamifiedLayer && hasIntroContent) return "landing";
    if (isGamifiedLayer && hasL3App && !hasIntroContent) return "map";
    return "intro";
  });
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(() => {
    if (!initialLevel) return null;
    const layerNum = Number(layerId);
    const isGamifiedLayer = layerNum === 1 || layerNum === 2 || layerNum === 3;
    if (!isGamifiedLayer) return null;
    if (initialLevel === 1) return 1;
    if (initialLevel === 2 || initialLevel === 3) {
      const userId = typeof window !== "undefined" ? getCurrentUserId() : null;
      if (isAdmin(userId)) return initialLevel;
      const prog = typeof window !== "undefined" ? loadModuleProgress(moduleId) : null;
      const l1 = prog?.level1;
      if (l1 != null && l1.score >= L2_UNLOCK_SCORE) return initialLevel;
      return null;
    }
    return null;
  });
  const [progress, setProgress] = useState<ReturnType<typeof loadModuleProgress>>(null);

  const hasIntro =
    moduleGuide &&
    (moduleGuide.blocks.length > 0 ||
      (moduleGuide.sections && moduleGuide.sections.length > 0));

  const isGamified = Number(layerId) === 1 || Number(layerId) === 2 || Number(layerId) === 3;
  const useLanding = isGamified && hasIntro;

  useEffect(() => {
    if (isGamified && typeof window !== "undefined") {
      setProgress(loadModuleProgress(moduleId));
    }
  }, [isGamified, moduleId]);

  useEffect(() => {
    if (step === "map" && isGamified && typeof window !== "undefined") {
      setProgress(loadModuleProgress(moduleId));
    }
  }, [step, isGamified, moduleId]);

  if (step === "landing" && useLanding && moduleGuide) {
    return (
      <ModuleLanding
        guide={moduleGuide}
        moduleId={moduleId}
        onGoToIntro={() => setStep("intro")}
        onGoToPractice={() => setStep("map")}
      />
    );
  }

  if (step === "intro" && Number(layerId) === 3 && layer3IntroContent) {
    return (
      <Layer3IntroPage
        content={layer3IntroContent}
        onStartPractice={() => {
          markIntroSeen(moduleId);
          isGamified ? setStep("map") : setStep("real");
        }}
      />
    );
  }
  if (step === "intro" && hasIntro && moduleGuide && !layer3IntroContent) {
    return (
      <ModuleIntro
        guide={moduleGuide}
        onStartPractice={() => {
          markIntroSeen(moduleId);
          isGamified ? setStep("map") : setStep("real");
        }}
      />
    );
  }

  if (isGamified && step === "map") {
    return (
      <ProgressMap
        moduleId={moduleId}
        moduleName={moduleName}
        layerId={layerId}
        progress={progress}
        onSelectLevel={(level) => {
          setSelectedLevel(level);
          setStep("level");
        }}
        onBackToIntro={() => setStep("intro")}
      />
    );
  }

  if (isGamified && step === "level" && selectedLevel) {
    return (
      <LevelGameplay
        moduleId={moduleId}
        level={selectedLevel}
        questions={realQuestions}
        layerId={layerId}
        layerName={layerName}
        moduleName={moduleName}
        onBackToMap={() => {
          setStep("map");
          setSelectedLevel(null);
          setProgress(loadModuleProgress(moduleId));
        }}
      />
    );
  }

  return (
    <div>
      <p className="page-desc">
        {step === "intro" && !hasIntro
          ? `共 ${realQuestions.length} 道题。（本模块暂无介绍）`
          : `正式练习：共 ${realQuestions.length} 道题。`}
      </p>
      <ModulePractice
        questions={realQuestions}
        layerId={layerId}
        layerName={layerName}
        moduleName={moduleName}
        onBackToIntro={hasIntro ? () => setStep("intro") : undefined}
        practiceMode="real"
      />
    </div>
  );
}
