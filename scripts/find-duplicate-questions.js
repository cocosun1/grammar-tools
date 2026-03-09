/**
 * find-duplicate-questions.js
 * Reports duplicate questions in data/questions.json.
 * Does NOT modify the file - read-only report.
 *
 * Two questions are duplicates if they have the same:
 * - type, layer, module, instruction_zh, explanation_zh
 * - question_en or prompt_en (content)
 * - options (if any)
 * - answer
 */

const fs = require("fs");
const path = require("path");

const QUESTIONS_PATH = path.join(__dirname, "..", "data", "questions.json");

function getContentKey(q) {
  return q.question_en ?? q.prompt_en ?? "";
}

function getOptionsKey(q) {
  if (!q.options || !Array.isArray(q.options)) return "";
  return JSON.stringify(q.options);
}

function getDuplicateKey(q) {
  return JSON.stringify({
    type: q.type,
    layer: q.layer,
    module: q.module ?? null,
    instruction_zh: q.instruction_zh,
    explanation_zh: q.explanation_zh,
    content: getContentKey(q),
    options: getOptionsKey(q),
    answer: q.answer,
  });
}

function main() {
  let questions;
  try {
    const raw = fs.readFileSync(QUESTIONS_PATH, "utf8");
    questions = JSON.parse(raw);
  } catch (err) {
    console.error("Error loading questions.json:", err.message);
    process.exit(1);
  }

  if (!Array.isArray(questions)) {
    console.error("questions.json is not an array");
    process.exit(1);
  }

  const groupsByKey = new Map();
  for (const q of questions) {
    const key = getDuplicateKey(q);
    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, []);
    }
    groupsByKey.get(key).push(q.id);
  }

  const duplicateGroups = [];
  for (const [key, ids] of groupsByKey.entries()) {
    if (ids.length > 1) {
      duplicateGroups.push(ids);
    }
  }

  duplicateGroups.sort((a, b) => b.length - a.length);

  console.log("=".repeat(60));
  console.log("DUPLICATE QUESTIONS REPORT");
  console.log("=".repeat(60));
  console.log(`Total questions: ${questions.length}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  const totalDuplicates = duplicateGroups.reduce(
    (sum, g) => sum + g.length - 1,
    0
  );
  console.log(`Questions to remove (keep 1 per group): ${totalDuplicates}`);
  console.log("=".repeat(60));

  if (duplicateGroups.length === 0) {
    console.log("\nNo duplicate questions found.");
    return;
  }

  console.log("\nDuplicate groups (ids in each group):\n");
  duplicateGroups.forEach((ids, i) => {
    console.log(`Group ${i + 1} (${ids.length} duplicates):`);
    console.log(`  [${ids.join(", ")}]`);
    console.log("");
  });

  console.log("=".repeat(60));
  console.log(`SUMMARY: ${totalDuplicates} duplicate(s) to remove`);
  console.log("=".repeat(60));
}

main();
