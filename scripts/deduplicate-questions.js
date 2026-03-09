/**
 * deduplicate-questions.js
 * Removes duplicate questions from data/questions.json.
 * Keeps the first occurrence of each duplicate group.
 *
 * Run: node scripts/deduplicate-questions.js
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

  const seen = new Set();
  const kept = [];
  let removed = 0;

  for (const q of questions) {
    const key = getDuplicateKey(q);
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    kept.push(q);
  }

  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(kept, null, 2), "utf8");
  console.log(`Removed ${removed} duplicate(s). Kept ${kept.length} questions.`);
}

main();
