import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUESTIONS_PATH = path.join(DATA_DIR, "questions.json");
const LEVEL3_QUESTIONS_PATH = path.join(DATA_DIR, "level3Questions.json");
const LAYER3_APP_PATH = path.join(DATA_DIR, "layer3Application.json");
const LAYER3_ARG_PATH = path.join(DATA_DIR, "layer3ArgumentData.json");

export type QuestionSource = "questions" | "level3" | "layer3app" | "layer3arg";

interface EditBody {
  source: QuestionSource;
  id: string;
  moduleId: number;
  question: Record<string, unknown>;
}

interface DeleteBody {
  source: QuestionSource;
  id: string;
  moduleId: number;
}

async function loadJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** GET: Return all questions grouped by layer/module with source metadata */
export async function GET() {
  try {
    const [questions, level3Data] = await Promise.all([
      loadJson<Record<string, unknown>[]>(QUESTIONS_PATH),
      loadJson<Record<string, Record<string, unknown>[]>>(LEVEL3_QUESTIONS_PATH),
    ]);

    const byLayer: Record<number, Record<number, Array<Record<string, unknown> & { _source?: QuestionSource }>>> = {};

    for (const q of questions) {
      const layer = (q.layer as number) ?? 1;
      const moduleId = (q.module as number) ?? 0;
      if (!byLayer[layer]) byLayer[layer] = {};
      if (!byLayer[layer][moduleId]) byLayer[layer][moduleId] = [];
      byLayer[layer][moduleId].push({ ...q, _source: "questions" });
    }

    for (const [moduleKey, arr] of Object.entries(level3Data)) {
      const moduleId = Number(moduleKey);
      if (Number.isNaN(moduleId) || !Array.isArray(arr)) continue;
      const layer = 1;
      if (!byLayer[layer]) byLayer[layer] = {};
      if (!byLayer[layer][moduleId]) byLayer[layer][moduleId] = [];
      for (const q of arr) {
        byLayer[layer][moduleId].push({ ...q, _source: "level3" });
      }
    }

    return NextResponse.json({ grouped: byLayer });
  } catch (err) {
    console.error("GET /api/admin/questions:", err);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}

/** PATCH: Update a question */
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as EditBody;
    const { source, id, moduleId, question } = body;
    if (!source || !id || moduleId == null || !question) {
      return NextResponse.json({ error: "Missing source, id, moduleId, or question" }, { status: 400 });
    }
    if (source !== "questions" && source !== "level3") {
      return NextResponse.json({ error: "Unsupported source" }, { status: 400 });
    }

    if (source === "questions") {
      const data = await loadJson<Record<string, unknown>[]>(QUESTIONS_PATH);
      const idx = data.findIndex((q) => (q.id as string) === id);
      if (idx === -1) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      data[idx] = { ...data[idx], ...question, id, layer: data[idx].layer, module: data[idx].module };
      await writeJson(QUESTIONS_PATH, data);
    } else {
      const data = await loadJson<Record<string, Record<string, unknown>[]>>(LEVEL3_QUESTIONS_PATH);
      const arr = data[String(moduleId)];
      if (!Array.isArray(arr)) return NextResponse.json({ error: "Module not found" }, { status: 404 });
      const idx = arr.findIndex((q) => (q.id as string) === id);
      if (idx === -1) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      arr[idx] = { ...arr[idx], ...question, id };
      await writeJson(LEVEL3_QUESTIONS_PATH, data);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/questions:", err);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

/** DELETE: Remove a question (or Layer 3 app question / argument prompt) */
export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteBody;
    const { source, id, moduleId } = body;
    if (!source || !id || moduleId == null) {
      return NextResponse.json({ error: "Missing source, id, or moduleId" }, { status: 400 });
    }
    const validSources: QuestionSource[] = ["questions", "level3", "layer3app", "layer3arg"];
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: "Unsupported source" }, { status: 400 });
    }

    if (source === "questions") {
      const data = await loadJson<Record<string, unknown>[]>(QUESTIONS_PATH);
      const filtered = data.filter((q) => (q.id as string) !== id);
      if (filtered.length === data.length) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      await writeJson(QUESTIONS_PATH, filtered);
    } else if (source === "level3") {
      const data = await loadJson<Record<string, Record<string, unknown>[]>>(LEVEL3_QUESTIONS_PATH);
      const arr = data[String(moduleId)];
      if (!Array.isArray(arr)) return NextResponse.json({ error: "Module not found" }, { status: 404 });
      const filtered = arr.filter((q) => (q.id as string) !== id);
      if (filtered.length === arr.length) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      data[String(moduleId)] = filtered;
      await writeJson(LEVEL3_QUESTIONS_PATH, data);
    } else if (source === "layer3app") {
      type Section = { questions?: Array<Record<string, unknown>>; [k: string]: unknown };
      type ModuleEntry = { sections?: Section[]; [k: string]: unknown };
      const data = await loadJson<Record<string, ModuleEntry>>(LAYER3_APP_PATH);
      const module = data[String(moduleId)];
      if (!module || !Array.isArray(module.sections)) return NextResponse.json({ error: "Module not found" }, { status: 404 });
      let found = false;
      for (const section of module.sections) {
        if (!Array.isArray(section.questions)) continue;
        const before = section.questions.length;
        section.questions = section.questions.filter((q) => (q.id as string) !== id);
        if (section.questions.length < before) {
          found = true;
          break;
        }
      }
      if (!found) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      await writeJson(LAYER3_APP_PATH, data);
    } else {
      // layer3arg
      const data = await loadJson<Record<string, Array<Record<string, unknown>>>>(LAYER3_ARG_PATH);
      const arr = data[String(moduleId)];
      if (!Array.isArray(arr)) return NextResponse.json({ error: "Module not found" }, { status: 404 });
      const filtered = arr.filter((p) => (p.id as string) !== id);
      if (filtered.length === arr.length) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      data[String(moduleId)] = filtered;
      await writeJson(LAYER3_ARG_PATH, data);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/questions:", err);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
