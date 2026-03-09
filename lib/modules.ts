import type { ModuleIntro } from "@/types/module";
import modulesData from "@/data/modules.json";

const modules: ModuleIntro[] = modulesData as ModuleIntro[];

export function getModuleIntro(moduleId: number): ModuleIntro | undefined {
  return modules.find((m) => m.id === moduleId);
}
