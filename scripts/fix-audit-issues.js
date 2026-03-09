/**
 * Fix issues found by audit-questions.js.
 * Run: node scripts/fix-audit-issues.js
 */

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");

// Load data
const questionsPath = path.join(dataDir, "questions.json");
const questions = JSON.parse(fs.readFileSync(questionsPath, "utf8"));

const l3Path = path.join(dataDir, "level3Questions.json");
const l3 = JSON.parse(fs.readFileSync(l3Path, "utf8"));

function findAndFix(arr, pred, fix) {
  for (let i = 0; i < arr.length; i++) {
    if (pred(arr[i])) {
      fix(arr[i]);
      return true;
    }
  }
  return false;
}

function fixAll(arr) {
  let n = 0;
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    if (q.id === "q624") {
      q.question_en = "He doesn't require numerous milk.";
      q.answer = "He doesn't require much milk.";
      q.explanation_zh = "milk 为不可数名词，不能用 numerous 修饰，应改为 much。";
      n++;
    }
    if (q.id === "q-exp-mod1-018") {
      q.question_en = "He doesn't have numerous time.";
      q.answer = "He doesn't have much time.";
      q.explanation_zh = "time 表「时间」时不可数，用 much 而非 numerous。";
      n++;
    }
    if (q.id === "q-exp-mod3-009") {
      q.question_en = "She doesn't require numerous milk.";
      q.answer = "She doesn't require much milk.";
      q.explanation_zh = "milk 为不可数名词，不能用 numerous 修饰，应改为 much。";
      n++;
    }
    if (q.id === "q762") {
      q.question_en = "He doesn't have ____ milk left.";
      n++;
    }
    if (q.id === "q-exp-mod1-013") {
      q.question_en = "She doesn't have ____ milk left.";
      n++;
    }
  }
  return n;
}

let totalFixed = 0;

if (Array.isArray(questions)) {
  totalFixed += fixAll(questions);
} else {
  for (const key of Object.keys(questions)) {
    if (Array.isArray(questions[key])) {
      totalFixed += fixAll(questions[key]);
    }
  }
}

// Fix explanation mismatches - map of id -> { explanation_zh: new value }
const explanationFixes = {
  q011: { explanation_zh: "resource 为不可数名词，不能用 numerous 修饰，应改为 much。" },
  q066: { explanation_zh: "funds 为复数名词，谓语用复数 are。" },
  q105: { explanation_zh: "computer 以辅音音素开头，用 a。" },
  q823: { explanation_zh: "table 以辅音音素开头，用 a。（注意：句中 table 重复，表意略怪）" },
  q824: { explanation_zh: "phone 以辅音音素开头，用 a。" },
  q109: { explanation_zh: "publication 以辅音音素开头，用 a。" },
  q831: { explanation_zh: "publication 以辅音音素开头，用 a。" },
  q832: { explanation_zh: "publication 以辅音音素开头，用 a。" },
  q110: { explanation_zh: "previous 以辅音音素开头，用 a。" },
  q833: { explanation_zh: "previous 以辅音音素开头，用 a。" },
  q138: { explanation_zh: "period 表「时间」时，可用 a little / much 等；这里用 limited 或 a short 等。" },
  q146: { explanation_zh: "funds 为复数，谓语用复数。____ 填 are。" },
  q905: { explanation_zh: "funds 为复数，谓语用复数。" },
  q906: { explanation_zh: "funds 为复数，谓语用复数。" },
  q153: { explanation_zh: "individuals 为可数名词复数，用 numerous 或 many 修饰。" },
  q156: { explanation_zh: "resource 为不可数名词，用 much 修饰。" },
  "q-exp-mod3-005": { explanation_zh: "period 表「时间」时，可用 limited 或 a short 等；不可用 numerous。" },
  "q-exp-mod3-008": { explanation_zh: "period 表「时间」时，可用 limited 或 a short 等；不可用 numerous。" },
  "q-exp-mod3-011": { explanation_zh: "period 表「时间」时，可用 limited 或 a short 等；不可用 numerous。" },
  "q-exp-mod3-015": { explanation_zh: "period 表「时间」时，可用 limited 或 a short 等；不可用 numerous。" },
  "q-exp-mod5-011": { explanation_zh: "We 是第一人称复数，谓语用原形 study。" },
  "q-exp-mod5-014": { explanation_zh: "I 是第一人称单数，谓语用原形 study。" },
  "q-exp-mod8-006": { explanation_zh: "We 是第一人称复数，过去进行时用 were watching。" },
  "q-exp-mod8-010": { explanation_zh: "I 是第一人称单数，过去进行时用 was watching。" },
  "q-exp-mod8-014": { explanation_zh: "She 是第三人称单数，过去进行时用 was watching。" },
  "q-exp-mod8-025": { explanation_zh: "He 是第三人称单数，过去进行时用 was watching。" },
};

function applyExplFixes(arr) {
  let n = 0;
  for (const q of arr) {
    if (!q?.id) continue;
    const fix = explanationFixes[q.id];
    if (fix) {
      Object.assign(q, fix);
      n++;
    }
  }
  return n;
}

if (Array.isArray(questions)) {
  totalFixed += applyExplFixes(questions);
} else {
  for (const key of Object.keys(questions)) {
    if (Array.isArray(questions[key])) {
      totalFixed += applyExplFixes(questions[key]);
    }
  }
}

// Fix q-nat-16-001, l3q001, l3q006, l3q007, l3q010, l3q023, l3q025, l3q040
function applyMoreExplFixes(arr) {
  let n = 0;
  for (const q of arr) {
    if (!q?.id) continue;
    if (q.id === "q-nat-16-001") {
      q.explanation_zh = "修饰动词用副词 well，不用形容词 good。";
      n++;
    }
    if (q.id === "l3q001") { q.explanation_zh = "information 不可数，定语从句谓语用单数 is。"; n++; }
    if (q.id === "l3q006") { q.explanation_zh = "information 不可数，定语从句谓语用单数 is。"; n++; }
    if (q.id === "l3q007") { q.explanation_zh = "resource 不可数，用 much 修饰。"; n++; }
    if (q.id === "l3q010") { q.explanation_zh = "funds 为复数，谓语用复数 were。"; n++; }
    if (q.id === "l3q023") { q.explanation_zh = "information 不可数，谓语用单数 is。"; n++; }
    if (q.id === "l3q025") { q.explanation_zh = "information 不可数，相关谓语用单数。"; n++; }
    if (q.id === "l3q040") { q.explanation_zh = "computer 以辅音音素开头，用 a。"; n++; }
  }
  return n;
}

if (Array.isArray(questions)) {
  totalFixed += applyMoreExplFixes(questions);
} else {
  for (const key of Object.keys(questions)) {
    if (Array.isArray(questions[key])) {
      totalFixed += applyMoreExplFixes(questions[key]);
    }
  }
}

for (const modId of Object.keys(l3)) {
  if (Array.isArray(l3[modId])) {
    totalFixed += applyMoreExplFixes(l3[modId]);
  }
}

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), "utf8");
fs.writeFileSync(l3Path, JSON.stringify(l3, null, 2), "utf8");
console.log("Fixed", totalFixed, "issues.");