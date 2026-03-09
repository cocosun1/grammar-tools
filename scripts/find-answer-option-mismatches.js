/**
 * Find questions where answer is not in options.
 * Run: node scripts/find-answer-option-mismatches.js
 */

const fs = require("fs");
const path = require("path");

function normalize(str) {
  if (typeof str !== "string") return "";
  return str.trim().toLowerCase();
}

function hasAnswerInOptions(options, answer) {
  if (!Array.isArray(options) || options.length === 0) return true;
  const ansNorm = normalize(answer);
  return options.some((o) => normalize(o) === ansNorm);
}

function collectFromArray(arr, file, key, results) {
  if (!Array.isArray(arr)) return;
  arr.forEach((q, idx) => {
    if (q.options && q.answer !== undefined && q.answer !== null) {
      if (!hasAnswerInOptions(q.options, String(q.answer))) {
        results.push({
          file,
          key: key ? `${key}[${idx}]` : String(idx),
          id: q.id,
          question_en: q.question_en || q.prompt_en || "(no prompt)",
          options: q.options,
          answer: q.answer,
        });
      }
    }
  });
}

function collectFromObject(obj, file, prefix, results) {
  if (!obj || typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        if (item && typeof item === "object" && item.options && item.answer != null) {
          if (!hasAnswerInOptions(item.options, String(item.answer))) {
            results.push({
              file,
              key: `${k}[${idx}]`,
              id: item.id,
              question_en: item.question_en || item.prompt_en || "(no prompt)",
              options: item.options,
              answer: item.answer,
            });
          }
        }
      });
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      collectFromObject(v, file, prefix ? `${prefix}.${k}` : k, results);
    }
  }
}

const dataDir = path.join(__dirname, "../data");
const results = [];

// questions.json - flat array or keyed by module
const qPath = path.join(dataDir, "questions.json");
if (fs.existsSync(qPath)) {
  const q = JSON.parse(fs.readFileSync(qPath, "utf8"));
  if (Array.isArray(q)) {
    collectFromArray(q, "questions.json", null, results);
  } else {
    for (const [modId, arr] of Object.entries(q)) {
      if (Array.isArray(arr)) collectFromArray(arr, "questions.json", `module ${modId}`, results);
    }
  }
}

// level3Questions.json - keyed by module id
const l3Path = path.join(dataDir, "level3Questions.json");
if (fs.existsSync(l3Path)) {
  const l3 = JSON.parse(fs.readFileSync(l3Path, "utf8"));
  for (const [modId, arr] of Object.entries(l3)) {
    if (Array.isArray(arr)) collectFromArray(arr, "level3Questions.json", `module ${modId}`, results);
  }
}

// layer3Application.json - modules with sections.questions
const appPath = path.join(dataDir, "layer3Application.json");
if (fs.existsSync(appPath)) {
  const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
  for (const [modId, mod] of Object.entries(app)) {
    if (mod?.sections) {
      mod.sections.forEach((sec, si) => {
        const qs = sec?.questions;
        if (Array.isArray(qs)) {
          qs.forEach((q, qi) => {
            if (q?.options && q.answer != null && !hasAnswerInOptions(q.options, String(q.answer))) {
              results.push({
                file: "layer3Application.json",
                key: `module ${modId} section ${sec.id} [${qi}]`,
                id: q.id,
                question_en: q.question_en || q.prompt_en || "(no prompt)",
                options: q.options,
                answer: q.answer,
              });
            }
          });
        }
      });
    }
  }
}

console.log(`Found ${results.length} questions with answer not in options:\n`);
results.forEach((r) => {
  console.log(`${r.file} | ${r.key} | id: ${r.id}`);
  console.log(`  prompt: ${(r.question_en || "").slice(0, 80)}...`);
  console.log(`  options: [${r.options.join(", ")}]`);
  console.log(`  answer: ${r.answer}`);
  console.log("");
});
