/**
 * Comprehensive audit of all questions in the databank.
 * Checks: answer in options, explanation matches content, grammatical validity.
 * Run: node scripts/audit-questions.js
 */

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const issues = [];

function normalize(s) {
  if (typeof s !== "string") return "";
  return s.trim().toLowerCase();
}

function hasAnswerInOptions(options, answer) {
  if (!Array.isArray(options) || options.length === 0) return true;
  const ansNorm = normalize(answer);
  return options.some((o) => normalize(o) === ansNorm);
}

// Extract nouns/words from explanation that should appear in the question
function extractExplanationRefs(expl) {
  if (!expl || typeof expl !== "string") return [];
  const m = expl.match(/再次提到前文出现的\s*([^，。]+)/);
  if (m) return [m[1].trim()];
  const m2 = expl.match(/([a-zA-Z]+)\s*以[元辅]音/);
  if (m2) return [m2[1].trim()];
  const m3 = expl.match(/([a-zA-Z]+)\s*(?:为|是|不可数|可数)/);
  if (m3) return [m3[1].trim()];
  return [];
}

function refsMatchQuestion(refs, prompt, answer) {
  if (refs.length === 0) return true;
  const text = (prompt + " " + answer).toLowerCase();
  for (const r of refs) {
    if (r && !text.includes(r.toLowerCase())) return false;
  }
  return true;
}

// Common wrong patterns (answer is ungrammatical)
const WRONG_PATTERNS = [
  { pattern: /\b(We|They|I|You)\s+doesn't\b/i, msg: "plural/first person with doesn't" },
  { pattern: /\b(We|They|I)\s+goes\b/i, msg: "plural/first person with goes" },
  { pattern: /\b(He|She|It)\s+(don't|not\s+\w+)\b/i, msg: "third person singular with don't or 'not + verb'" },
  { pattern: /\b(He|She)\s+not\s+\w+\b/i, msg: "He/She not + verb (missing doesn't)" },
  { pattern: /\b(I|We|They)\s+doesn't\b/i, msg: "I/We/They with doesn't" },
  { pattern: /\ba\s+(honest|hour|honor|heir|american|interesting|elephant|apple|island|umbrella|idea)\b/i, msg: "a before vowel sound (should be an)" },
  { pattern: /\ban\s+(unique|university|useful|european|one)\b/i, msg: "an before consonant sound (should be a)" },
  { pattern: /\b(numerous|many)\s+(equipment|milk|rice|information|advice|luggage|paper|water)\b/i, msg: "numerous/many with uncountable noun" },
];

function checkAnswerGrammar(text, label, id) {
  if (!text || typeof text !== "string") return;
  for (const { pattern, msg } of WRONG_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({
        type: "answer_ungrammatical",
        loc: label,
        id,
        text: text.slice(0, 80),
        detail: msg,
      });
    }
  }
}

function checkQuestionGrammar(text, label, id) {
  if (!text || typeof text !== "string") return;
  for (const { pattern, msg } of WRONG_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({
        type: "question_ungrammatical",
        loc: label,
        id,
        text: text.slice(0, 80),
        detail: msg,
      });
    }
  }
}

function auditQuestion(q, file, key) {
  const loc = `${file}:${key}`;
  const prompt = (q.prompt_en ?? q.question_en ?? "").toString();
  const answer = (q.answer ?? "").toString();
  const expl = (q.explanation_zh ?? "").toString();

  if (q.options && q.answer != null) {
    if (!hasAnswerInOptions(q.options, answer)) {
      issues.push({
        type: "answer_not_in_options",
        loc,
        id: q.id,
        prompt: prompt.slice(0, 60),
        options: q.options,
        answer,
      });
    }
  }

  const refs = extractExplanationRefs(expl);
  if (refs.length > 0) {
    const matches = refsMatchQuestion(refs, prompt, answer);
    if (!matches) {
      issues.push({
        type: "explanation_mismatch",
        loc,
        id: q.id,
        prompt: prompt.slice(0, 60),
        explanation_refs: refs,
        detail: `Explanation mentions "${refs.join(", ")}" but not in question/answer`,
      });
    }
  }

  if (answer) checkAnswerGrammar(answer, `${loc} answer`, q.id);
  // Skip question_ungrammatical for sentence_correction - question_en is the wrong sentence by design
  if (prompt && q.type !== "sentence_correction") {
    checkQuestionGrammar(prompt, `${loc} question_en`, q.id);
  }

  if (q.type === "sentence_choice" && q.options && q.answer) {
    const correctOpt = q.options.find((o) => normalize(o) === normalize(answer));
    if (correctOpt) checkAnswerGrammar(correctOpt, `${loc} (correct option)`, q.id);
  }
}

function collectFromArray(arr, file, keyPrefix) {
  if (!Array.isArray(arr)) return;
  arr.forEach((q, i) => {
    if (q && typeof q === "object") {
      auditQuestion(q, file, `${keyPrefix}[${i}]`);
    }
  });
}

function runAudit() {
  const qPath = path.join(dataDir, "questions.json");
  const qData = JSON.parse(fs.readFileSync(qPath, "utf8"));
  if (Array.isArray(qData)) {
    collectFromArray(qData, "questions.json", "root");
  } else {
    for (const [k, arr] of Object.entries(qData)) {
      if (Array.isArray(arr)) collectFromArray(arr, "questions.json", `module ${k}`);
    }
  }

  const l3Path = path.join(dataDir, "level3Questions.json");
  const l3 = JSON.parse(fs.readFileSync(l3Path, "utf8"));
  for (const [modId, arr] of Object.entries(l3)) {
    if (Array.isArray(arr)) collectFromArray(arr, "level3Questions.json", `module ${modId}`);
  }

  const appPath = path.join(dataDir, "layer3Application.json");
  const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
  for (const [modId, mod] of Object.entries(app)) {
    if (mod?.sections) {
      mod.sections.forEach((sec) => {
        const qs = sec?.questions;
        if (Array.isArray(qs)) {
          qs.forEach((q, i) => {
            if (q) auditQuestion(q, "layer3Application.json", `mod ${modId} ${sec.id}[${i}]`);
          });
        }
      });
    }
  }

  const byType = {};
  for (const i of issues) {
    byType[i.type] = (byType[i.type] || 0) + 1;
  }

  console.log("=== AUDIT REPORT ===\n");
  console.log("Total issues:", issues.length);
  console.log("By type:", JSON.stringify(byType, null, 2));
  console.log("\n--- Details ---\n");

  const shown = issues.slice(0, 150);
  shown.forEach((i, idx) => {
    console.log(`${idx + 1}. [${i.type}] ${i.loc || ""} ${i.id || ""}`);
    if (i.prompt) console.log(`   prompt: ${i.prompt}`);
    if (i.answer) console.log(`   answer: ${i.answer}`);
    if (i.detail) console.log(`   detail: ${i.detail}`);
    if (i.explanation_refs) console.log(`   refs: ${i.explanation_refs.join(", ")}`);
    if (i.options) console.log(`   options: ${JSON.stringify(i.options)}`);
    console.log("");
  });

  if (issues.length > 150) {
    console.log(`... and ${issues.length - 150} more. Full report written to audit-report.json`);
    fs.writeFileSync(
      path.join(__dirname, "audit-report.json"),
      JSON.stringify(issues, null, 2),
      "utf8"
    );
  }
}

runAudit();
