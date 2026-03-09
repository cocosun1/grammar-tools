import Link from "next/link";
import { notFound } from "next/navigation";
import { LAYERS } from "@/types/curriculum";
import { ModuleGridWithProgress } from "@/components/ModuleGridWithProgress";

interface Props {
  params: Promise<{ layerId: string }>;
}

export default async function LayerPage({ params }: Props) {
  const { layerId } = await params;
  const layer = LAYERS.find((l) => l.id === Number(layerId));
  if (!layer) notFound();

  const isLayer3 = layer.id === 3;

  return (
    <div className={isLayer3 ? "layer-page layer-3-complex" : "layer-page"}>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span> / {layer.name_zh}</span>
      </nav>
      <h1 className="page-title">{layer.name_zh}</h1>
      <p className="page-desc">
        {isLayer3
          ? "从语法和句子结构进阶到更长、更密集、逻辑更清晰的英语表达，适合 TOEFL 写作与口语。选择模块开始练习。"
          : "选择模块开始练习。"}
      </p>

      <ModuleGridWithProgress layer={layer} />
    </div>
  );
}
