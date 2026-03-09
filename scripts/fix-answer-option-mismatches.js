/**
 * Fix questions where answer is not in options by adding answer to options.
 * Run: node scripts/fix-answer-option-mismatches.js
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

function fixQuestion(q) {
  if (!q.options || q.answer == null) return false;
  if (hasAnswerInOptions(q.options, String(q.answer))) return false;
  // Add answer to options (prepend so it's visible; keep original casing from answer)
  q.options = [String(q.answer), ...q.options];
  return true;
}

const dataDir = path.join(__dirname, "../data");
let totalFixed = 0;

// questions.json
const qPath = path.join(dataDir, "questions.json");
const questions = JSON.parse(fs.readFileSync(qPath, "utf8"));
if (Array.isArray(questions)) {
  questions.forEach((q) => {
    if (fixQuestion(q)) totalFixed++;
  });
  fs.writeFileSync(qPath, JSON.stringify(questions, null, 2), "utf8");
  console.log(`Fixed questions.json (array)`);
} else {
  for (const [modId, arr] of Object.entries(questions)) {
    if (Array.isArray(arr)) {
      arr.forEach((q) => {
        if (fixQuestion(q)) totalFixed++;
      });
    }
  }
  fs.writeFileSync(qPath, JSON.stringify(questions, null, 2), "utf8");
  console.log(`Fixed questions.json (keyed)`);
}

// level3Questions.json
const l3Path = path.join(dataDir, "level3Questions.json");
const l3 = JSON.parse(fs.readFileSync(l3Path, "utf8"));
for (const [modId, arr] of Object.entries(l3)) {
  if (Array.isArray(arr)) {
    arr.forEach((q) => {
      if (fixQuestion(q)) totalFixed++;
    });
  }
}
fs.writeFileSync(l3Path, JSON.stringify(l3, null, 2), "utf8");
console.log(`Fixed level3Questions.json`);

// layer3Application.json
const appPath = path.join(dataDir, "layer3Application.json");
const app = JSON.parse(fs.readFileSync(appPath, "utf8"));
for (const [modId, mod] of Object.entries(app)) {
  if (mod?.sections) {
    mod.sections.forEach((sec) => {
      const qs = sec?.questions;
      if (Array.isArray(qs)) {
        qs.forEach((q) => {
          if (fixQuestion(q)) totalFixed++;
        });
      }
    });
  }
}
fs.writeFileSync(appPath, JSON.stringify(app, null, 2), "utf8");
console.log(`Fixed layer3Application.json`);

console.log(`\nTotal fixed: ${totalFixed}`);
