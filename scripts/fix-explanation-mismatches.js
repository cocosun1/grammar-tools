/**
 * fix-explanation-mismatches.js
 * Fixes explanations that mention the wrong noun (e.g. "news" when question is about "information").
 *
 * Run: node scripts/fix-explanation-mismatches.js
 */

const fs = require("fs");
const path = require("path");

const QUESTIONS_PATH = path.join(__dirname, "..", "data", "questions.json");

// Mappings: when question content indicates X but explanation wrongly mentions Y, fix it.
const FIXES = [
  // information question but explanation says news
  {
    match: (q) => {
      const content = (q.question_en ?? q.prompt_en ?? "").toLowerCase();
      const answer = (q.answer ?? "").toLowerCase();
      return (
        content.includes("information") ||
        answer.includes("information") ||
        (Array.isArray(q.options) && q.options.some((o) => o.toLowerCase().includes("information")))
      );
    },
    explanationContains: "news",
    replacements: [
      {
        from: /news 为不可数名词，不能加 -s，表示.一条信息.用 a segment of news。/,
        to: "information 为不可数名词，不能加 -s，表示「一条信息」用 a piece of information。",
      },
      {
        from: "news 虽以 -s 结尾，但是不可数名词，谓语用单数。",
        to: "information 为不可数名词，无复数形式，谓语用单数。",
      },
      {
        from: "news 虽以 -s 结尾，但不可数。",
        to: "information 为不可数名词，无复数形式。",
      },
      {
        from: "news 不可数，用 much；表示「一些信息」可用 some news。",
        to: "information 不可数，用 much；表示「一些信息」可用 some information。",
      },
      {
        from: "news 不可数，谓语用单数。",
        to: "information 不可数，谓语用单数。",
      },
      {
        from: "news 不可数。",
        to: "information 不可数。",
      },
    ],
  },
  // judgement: publication question but explanation uses wrong noun (book, gift, etc.)
  {
    match: (q) => (q.question_en ?? q.prompt_en ?? "").trim().toLowerCase() === "publication",
    explanationContains: "可数",
    replacements: [
      { from: "book 可数，可以说 a book, two books。", to: "publication 可数，可以说 a publication, two publications。" },
      { from: "gift 可数，可以说 a gift, two gifts。", to: "publication 可数，可以说 a publication, two publications。" },
    ],
  },
];

function main() {
  let questions;
  try {
    const raw = fs.readFileSync(QUESTIONS_PATH, "utf8");
    questions = JSON.parse(raw);
  } catch (err) {
    console.error("Error loading questions.json:", err.message);
    process.exit(1);
  }

  let fixed = 0;
  for (const q of questions) {
    for (const fix of FIXES) {
      if (!fix.match(q)) continue;
      let expl = q.explanation_zh || "";
      if (!expl.includes(fix.explanationContains)) continue;

      for (const r of fix.replacements) {
        const from = r.from;
        const to = r.to;
        if (typeof from === "string") {
          if (expl.includes(from)) expl = expl.replace(from, to);
        } else {
          expl = expl.replace(from, to);
        }
      }
      if (expl !== q.explanation_zh) {
        q.explanation_zh = expl;
        fixed++;
      }
    }
  }

  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), "utf8");
  console.log(`Fixed ${fixed} explanation(s).`);
}

main();
