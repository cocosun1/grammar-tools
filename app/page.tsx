import Link from "next/link";
import { LAYERS } from "@/types/curriculum";
import { HomeProgressBar } from "@/components/HomeProgressBar";

export default function HomePage() {
  return (
    <div>
      <h1 className="page-title">英语语法练习</h1>
      <p className="page-desc">通过短练习巩固英语语法。请选择学习层级。</p>

      <HomeProgressBar />

      <section className="layer-list">
        {LAYERS.map((layer) => (
          <Link
            key={layer.id}
            href={layer.isPlaceholder ? "#" : `/layer/${layer.id}`}
            className={`layer-card ${layer.isPlaceholder ? "placeholder" : ""}`}
          >
            <h2>{layer.name_zh}</h2>
            <p>
              {layer.isPlaceholder
                ? "即将开放"
                : `${layer.modules.length} 个模块`}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
