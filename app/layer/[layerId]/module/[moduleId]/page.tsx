import Link from "next/link";
import { notFound } from "next/navigation";
import { LAYERS } from "@/types/curriculum";
import { getModuleGuide } from "@/lib/guides";
import { getQuestionsByModule } from "@/lib/questions";
import layer3IntroData from "@/data/layer3IntroData.json";
import { ModuleFlow } from "@/components/ModuleFlow";
import type { Layer3IntroContentMap } from "@/types/layer3Intro";

interface Props {
  params: Promise<{ layerId: string; moduleId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ModulePage({ params, searchParams }: Props) {
  const { layerId, moduleId } = await params;
  const search = await searchParams;
  const levelParam = search?.level;
  const initialLevel = levelParam === "3" ? 3 : levelParam === "2" ? 2 : levelParam === "1" ? 1 : null;
  const layer = LAYERS.find((l) => l.id === Number(layerId));
  const moduleInfo = layer?.modules.find((m) => m.id === Number(moduleId));
  if (!layer || !moduleInfo) notFound();

  const moduleGuide = getModuleGuide(Number(moduleId));
  const realQuestions = getQuestionsByModule(Number(moduleId));
  const layer3IntroContent = (layer3IntroData as Layer3IntroContentMap)[moduleId] ?? null;
  const hasIntro =
    moduleGuide &&
    (moduleGuide.blocks.length > 0 ||
      (moduleGuide.sections && moduleGuide.sections.length > 0));

  return (
    <div>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span> / </span>
        <Link href={`/layer/${layerId}`}>{layer.name_zh}</Link>
        <span> / {moduleInfo.name_zh}</span>
      </nav>
      {!hasIntro && (
        <h1 className="page-title">{moduleInfo.name_zh}</h1>
      )}

      <ModuleFlow
        moduleId={Number(moduleId)}
        moduleGuide={moduleGuide ?? null}
        layer3IntroContent={layer3IntroContent}
        realQuestions={realQuestions}
        layerId={layerId}
        layerName={layer.name_zh}
        moduleName={moduleInfo.name_zh}
        initialLevel={initialLevel ?? undefined}
      />
    </div>
  );
}
