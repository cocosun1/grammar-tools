import type { ModuleGuide } from "@/types/guide";
import guidesData from "@/data/moduleGuides.json";

const guides: ModuleGuide[] = guidesData as ModuleGuide[];

export function getModuleGuide(moduleId: number): ModuleGuide | undefined {
  return guides.find((g) => g.id === moduleId);
}
