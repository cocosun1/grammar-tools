/**
 * Upgrade vocabulary to intermediate + TOEFL-level words.
 * Run: node scripts/upgrade-vocabulary-toefl.js
 * Revert: node scripts/upgrade-vocabulary-toefl.js --revert
 *
 * Uses whole-word replacement. Mix of intermediate (e.g. acquire, several)
 * and TOEFL-level (e.g. demonstrate, numerous) for varied difficulty.
 * Intro pages (moduleGuides, moduleExamples) are upgraded to match practice.
 */
const fs = require("fs");
const path = require("path");

// Intermediate + TOEFL replacements: simple -> more academic (whole word only)
// Keys are lowercase; replacement preserves original capitalization.
const VOCAB_MAP = {
  // verbs
  buy: "acquire",
  bought: "acquired",
  buying: "acquiring",
  get: "obtain",
  got: "obtained",
  give: "provide",
  gave: "provided",
  need: "require",
  needed: "required",
  show: "indicate",
  showed: "indicated",
  say: "state",
  said: "stated",
  go: "proceed",
  went: "proceeded",
  come: "arrive",
  came: "arrived",
  make: "create",
  made: "created",
  see: "observe",
  saw: "observed",
  know: "recognize",
  knew: "recognized",
  find: "discover",
  found: "discovered",
  use: "apply",
  used: "applied",
  start: "initiate",
  started: "initiated",
  started: "commenced",
  try: "attempt",
  tried: "attempted",
  help: "assist",
  helped: "assisted",
  change: "alter",
  changed: "altered",
  keep: "maintain",
  kept: "maintained",
  leave: "depart",
  left: "departed",
  think: "consider",
  thought: "considered",
  tell: "inform",
  told: "informed",
  ask: "request",
  asked: "requested",
  live: "reside",
  lived: "resided",
  study: "examine",
  studied: "examined",
  write: "compose",
  wrote: "composed",
  speak: "express",
  spoke: "expressed",
  take: "undertake",
  took: "undertook",
  put: "place",
  end: "conclude",
  ended: "concluded",
  finish: "complete",
  finished: "completed",
  begin: "commence",
  began: "commenced",
  eat: "consume",
  drank: "consumed",
  drink: "consume",
  sleep: "rest",
  slept: "rested",
  stay: "remain",
  stayed: "remained",
  visit: "attend",
  visited: "attended",
  like: "appreciate",
  liked: "appreciated",
  love: "appreciate",
  loved: "appreciated",
  want: "desire",
  wanted: "desired",
  call: "contact",
  called: "contacted",
  meet: "encounter",
  met: "encountered",
  send: "submit",
  sent: "submitted",
  receive: "obtain",
  received: "obtained",

  // nouns (when used as standalone or in phrases we can safely replace)
  book: "text",
  books: "texts",
  apple: "computer",
  apples: "computers",
  student: "learner",
  students: "learners",
  teacher: "instructor",
  teachers: "instructors",
  school: "institution",
  house: "residence",
  car: "vehicle",
  job: "position",
  jobs: "positions",
  problem: "issue",
  problems: "issues",
  question: "inquiry",
  questions: "inquiries",
  idea: "concept",
  ideas: "concepts",
  place: "location",
  thing: "element",
  things: "elements",
  way: "method",
  ways: "methods",
  people: "individuals",
  man: "individual",
  men: "individuals",
  woman: "individual",
  women: "individuals",
  child: "learner",
  children: "learners",
  room: "chamber",
  rooms: "chambers",
  number: "figure",
  numbers: "figures",
  part: "portion",
  parts: "portions",
  kind: "category",
  kinds: "categories",
  example: "instance",
  examples: "instances",
  time: "period",
  answer: "response",
  answers: "responses",
  result: "outcome",
  results: "outcomes",
  reason: "factor",
  reasons: "factors",
  plan: "strategy",
  plans: "strategies",
  group: "committee",
  groups: "committees",
  team: "committee",
  meeting: "session",
  meetings: "sessions",
  test: "assessment",
  tests: "assessments",
  exam: "assessment",
  exams: "assessments",
  class: "session",
  report: "document",
  reports: "documents",
  letter: "correspondence",
  letters: "correspondence",
  story: "account",
  money: "funds",
  water: "resource",
  food: "resource",
  help: "assistance",
  change: "modification",
  rest: "remainder",
  half: "portion",
  lot: "quantity",
  bit: "portion",

  // adjectives
  big: "significant",
  small: "minimal",
  good: "positive",
  bad: "negative",
  important: "significant",
  many: "multiple",
  much: "substantial",
  new: "recent",
  old: "previous",
  long: "extended",
  short: "brief",
  high: "significant",
  low: "minimal",
  wrong: "incorrect",
  same: "identical",
  different: "distinct",
  other: "additional",
  first: "primary",
  last: "final",
  next: "subsequent",
  best: "optimal",
  whole: "entire",
  full: "complete",
  easy: "straightforward",
  hard: "challenging",
  difficult: "challenging",
  possible: "feasible",
  sure: "certain",
  clear: "evident",
  real: "genuine",
  main: "primary",
  common: "widespread",
  simple: "straightforward",

  // adverbs
  often: "frequently",
  always: "consistently",
  sometimes: "occasionally",
  never: "rarely",
  very: "highly",
  really: "genuinely",
  quite: "considerably",
  well: "effectively",
  quickly: "promptly",
  slowly: "gradually",
  together: "collectively",
  only: "exclusively",
  just: "precisely",
  also: "additionally",
  too: "additionally",
  now: "currently",
  then: "subsequently",
  today: "currently",
  yesterday: "previously",
  tomorrow: "subsequently",
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyMap(text, map) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const [key, value] of Object.entries(map)) {
    const re = new RegExp("\\b" + escapeRegex(key) + "\\b", "gi");
    out = out.replace(re, (match) =>
      match[0] === match[0].toUpperCase()
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : value
    );
  }
  return out;
}

function applyVocabMap(text) {
  return applyMap(text, VOCAB_MAP);
}

// Build reverse map for revert (TOEFL -> simple). If multiple keys map to same value, first wins.
const REVERSE_MAP = {};
for (const [key, value] of Object.entries(VOCAB_MAP)) {
  if (!REVERSE_MAP[value]) REVERSE_MAP[value] = key;
}

function applyRevertMap(text) {
  return applyMap(text, REVERSE_MAP);
}

// Keys we ever touch: for revert we undo all.
// examples_zh included so revert restores intro examples; we do NOT upgrade examples_zh.
const ALL_UPGRADED_KEYS = ["question_en", "prompt_en", "options", "answer", "instruction_zh", "explanation_zh", "examples_zh"];
// Upgrade only these; do not upgrade instruction_zh/explanation_zh (mixed Chinese + fixed English phrases).
const UPGRADE_KEYS = ["question_en", "prompt_en", "options"];

function isSingleWord(s) {
  return typeof s === "string" && /^\s*\S+\s*$/.test(s) && !s.includes(" ");
}
function isGrammarTargetPrompt(s) {
  return typeof s === "string" && /→\s*$/.test(s); // e.g. "much →", "many →"
}

function processObject(obj, mapFn, textKeys, options = {}) {
  if (!obj || typeof obj !== "object") return;
  const { skipPromptEnForWordForm = false, skipPromptEnIfSingleWord = false, skipGrammarTargetPrompt = false } = options;
  for (const key of Object.keys(obj)) {
    if (key === "prompt_en" && skipPromptEnForWordForm && obj.type === "word_form") continue;
    if (key === "prompt_en" && skipPromptEnIfSingleWord && isSingleWord(obj[key])) continue;
    if (key === "prompt_en" && skipGrammarTargetPrompt && isGrammarTargetPrompt(obj[key])) continue;
    if (textKeys.includes(key) && typeof obj[key] === "string") {
      obj[key] = mapFn(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item, i) => {
        if (typeof item === "string" && textKeys.includes(key)) obj[key][i] = mapFn(item);
        else if (item && typeof item === "object") processObject(item, mapFn, textKeys, options);
      });
    } else if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      processObject(obj[key], mapFn, textKeys, options);
    }
  }
}

const questionsPath = path.join(__dirname, "../data/questions.json");
const level3Path = path.join(__dirname, "../data/level3Questions.json");
const isRevert = process.argv.includes("--revert");

const guidesPath = path.join(__dirname, "../data/moduleGuides.json");
const examplesPath = path.join(__dirname, "../data/moduleExamples.json");

if (isRevert) {
  const questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  questions.forEach((q) => processObject(q, applyRevertMap, ALL_UPGRADED_KEYS));
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2) + "\n", "utf-8");
  console.log("Reverted data/questions.json");
  const level3 = JSON.parse(fs.readFileSync(level3Path, "utf-8"));
  Object.keys(level3).forEach((mod) => {
    level3[mod].forEach((q) => processObject(q, applyRevertMap, ALL_UPGRADED_KEYS));
  });
  fs.writeFileSync(level3Path, JSON.stringify(level3, null, 2) + "\n", "utf-8");
  console.log("Reverted data/level3Questions.json");
  const guides = JSON.parse(fs.readFileSync(guidesPath, "utf-8"));
  guides.forEach((g) => {
    (g.sections || []).forEach((s) => {
      (s.blocks || []).forEach((b) => processObject(b, applyRevertMap, ALL_UPGRADED_KEYS));
    });
  });
  fs.writeFileSync(guidesPath, JSON.stringify(guides, null, 2) + "\n", "utf-8");
  console.log("Reverted data/moduleGuides.json");
  const examples = JSON.parse(fs.readFileSync(examplesPath, "utf-8"));
  examples.forEach((q) => processObject(q, applyRevertMap, ALL_UPGRADED_KEYS));
  fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2) + "\n", "utf-8");
  console.log("Reverted data/moduleExamples.json");
} else {
  const questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  questions.forEach((q) => {
    const upgradeAnswer = (q.type === "sentence_correction" || q.type === "sentence_choice");
    processObject(q, applyVocabMap, UPGRADE_KEYS.concat(upgradeAnswer ? ["answer"] : []), {
      skipPromptEnForWordForm: true,
      upgradeAnswerForSentenceTypes: upgradeAnswer,
    });
  });
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2) + "\n", "utf-8");
  console.log("Upgraded data/questions.json");

  const level3 = JSON.parse(fs.readFileSync(level3Path, "utf-8"));
  Object.keys(level3).forEach((mod) => {
    level3[mod].forEach((q) => {
      const upgradeAnswer = (q.type === "sentence_correction" || q.type === "sentence_choice");
      processObject(q, applyVocabMap, UPGRADE_KEYS.concat(upgradeAnswer ? ["answer"] : []), {
        skipPromptEnForWordForm: true,
        upgradeAnswerForSentenceTypes: upgradeAnswer,
      });
    });
  });
  fs.writeFileSync(level3Path, JSON.stringify(level3, null, 2) + "\n", "utf-8");
  console.log("Upgraded data/level3Questions.json");

  // Intro pages: upgrade prompt_en, options, answer, AND examples_zh so intro matches practice
  const guideKeys = ["question_en", "prompt_en", "options", "answer", "examples_zh"];
  const guides = JSON.parse(fs.readFileSync(guidesPath, "utf-8"));
  guides.forEach((g) => {
    (g.sections || []).forEach((s) => {
      (s.blocks || []).forEach((b) => {
        processObject(b, applyVocabMap, guideKeys, {
          skipPromptEnForWordForm: true,
          skipPromptEnIfSingleWord: false, // upgrade single-word prompts (apple → computer)
          skipGrammarTargetPrompt: true,   // skip "much →", "many →" (teaching quantifiers)
        });
      });
    });
  });
  fs.writeFileSync(guidesPath, JSON.stringify(guides, null, 2) + "\n", "utf-8");
  console.log("Upgraded data/moduleGuides.json");

  const examplesPath = path.join(__dirname, "../data/moduleExamples.json");
  const examples = JSON.parse(fs.readFileSync(examplesPath, "utf-8"));
  examples.forEach((q) => {
    const upgradeAnswer = (q.type === "sentence_correction" || q.type === "sentence_choice");
    processObject(q, applyVocabMap, UPGRADE_KEYS.concat(upgradeAnswer ? ["answer"] : []), {
      skipPromptEnForWordForm: true,
    });
  });
  fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2) + "\n", "utf-8");
  console.log("Upgraded data/moduleExamples.json");
}

// level3Tasks.json is not upgraded: grammar_checks are word-specific for pedagogy.
