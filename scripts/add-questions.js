/**
 * Add questions to align each module to 33 questions (same as module 1).
 * Run: node scripts/add-questions.js
 */
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/questions.json");
const questions = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const byModule = {};
questions.forEach((q) => {
  byModule[q.module] = (byModule[q.module] || 0) + 1;
});

const TARGET = 33;
let nextId = 121;

const MODULE_NAMES = {
  2: "名词复数",
  3: "不可数名词",
  4: "冠词 (a / an / the)",
  5: "一般现在时",
  6: "一般过去时",
  7: "现在进行时",
  8: "过去进行时",
  9: "现在完成时",
  10: "将来时",
  11: "主谓一致",
  12: "情态动词",
};

// Templates for modules needing many questions (5 -> 33 = 28 each)
const EXTRAS = {
  3: [
    { type: "judgement", question_en: "rice", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "rice 为物质名词，不可数。" },
    { type: "judgement", question_en: "furniture", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "furniture 不可数。" },
    { type: "fill_choice", question_en: "The furniture ____ expensive.", options: ["is", "are"], answer: "is", explanation_zh: "不可数名词谓语用单数。" },
    { type: "sentence_correction", question_en: "I need many rice.", answer: "I need much rice.", explanation_zh: "rice 不可数，用 much。" },
    { type: "sentence_choice", options: ["He gave me some advice.", "He gave me an advice.", "He gave me many advices."], answer: "He gave me some advice.", explanation_zh: "advice 不可数，用 some。" },
    { type: "judgement", question_en: "time", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "time 表时间时不可数。" },
    { type: "fill_choice", question_en: "There ____ not much sugar left.", options: ["is", "are"], answer: "is", explanation_zh: "sugar 不可数，谓语用单数。" },
    { type: "judgement", question_en: "equipment", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "equipment 不可数。" },
    { type: "sentence_correction", question_en: "The information are correct.", answer: "The information is correct.", explanation_zh: "information 不可数，谓语用单数。" },
    { type: "fill_choice", question_en: "We have ____ time to finish.", options: ["a little", "a few"], answer: "a little", explanation_zh: "time 不可数，用 a little。" },
    { type: "judgement", question_en: "news", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "news 虽以 -s 结尾，但不可数。" },
    { type: "sentence_choice", options: ["Much research has been done.", "Many researches have been done.", "Much researches have been done."], answer: "Much research has been done.", explanation_zh: "research 常作不可数。" },
    { type: "fill_choice", question_en: "____ coffee is left.", options: ["A little", "A few"], answer: "A little", explanation_zh: "coffee 不可数。" },
    { type: "judgement", question_en: "sugar", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "sugar 物质名词，不可数。" },
    { type: "sentence_correction", question_en: "She has many luggage.", answer: "She has much luggage.", explanation_zh: "luggage 不可数。" },
    { type: "judgement", question_en: "knowledge", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "knowledge 不可数。" },
    { type: "fill_choice", question_en: "The luggage ____ heavy.", options: ["is", "are"], answer: "is", explanation_zh: "luggage 不可数。" },
    { type: "sentence_choice", options: ["I need some money.", "I need a money.", "I need many moneys."], answer: "I need some money.", explanation_zh: "money 不可数。" },
    { type: "sentence_correction", question_en: "They gave me many advice.", answer: "They gave me much advice.", explanation_zh: "advice 不可数。" },
    { type: "fill_choice", question_en: "____ information is available.", options: ["Much", "Many"], answer: "Much", explanation_zh: "information 不可数。" },
    { type: "judgement", question_en: "traffic", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "traffic 不可数。" },
    { type: "sentence_choice", options: ["The news is good.", "The news are good.", "The newss is good."], answer: "The news is good.", explanation_zh: "news 不可数。" },
    { type: "fill_choice", question_en: "She has ____ patience.", options: ["a little", "a few"], answer: "a little", explanation_zh: "patience 不可数。" },
    { type: "judgement", question_en: "patience", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "patience 抽象名词，不可数。" },
    { type: "sentence_correction", question_en: "Much people attended.", answer: "Many people attended.", explanation_zh: "people 可数，用 many。" },
    { type: "fill_choice", question_en: "The homework ____ difficult.", options: ["is", "are"], answer: "is", explanation_zh: "homework 不可数。" },
    { type: "judgement", question_en: "homework", options: ["可数名词", "不可数名词"], answer: "不可数名词", explanation_zh: "homework 不可数。" },
    { type: "sentence_choice", options: ["There is little water left.", "There are little water left.", "There is few water left."], answer: "There is little water left.", explanation_zh: "water 不可数，用 little。" },
  ],
  5: [
    { type: "sentence_correction", question_en: "The teacher teach us English.", answer: "The teacher teaches us English.", explanation_zh: "第三人称单数谓语加 -es。" },
    { type: "fill_choice", question_en: "My sister ____ music.", options: ["like", "likes"], answer: "likes", explanation_zh: "My sister 第三人称单数。" },
    { type: "sentence_choice", options: ["Dogs barks at strangers.", "Dogs bark at strangers.", "Dog barks at strangers."], answer: "Dogs bark at strangers.", explanation_zh: "复数主语用原形。" },
    { type: "word_form", prompt_en: "My father (work) in a hospital.", answer: "works", explanation_zh: "第三人称单数，work 加 -s。" },
    { type: "fill_choice", question_en: "They ____ football every Saturday.", options: ["play", "plays"], answer: "play", explanation_zh: "They 复数，谓语用原形。" },
    { type: "sentence_correction", question_en: "Tom want to go home.", answer: "Tom wants to go home.", explanation_zh: "第三人称单数谓语加 -s。" },
    { type: "fill_choice", question_en: "The cat ____ milk.", options: ["love", "loves"], answer: "loves", explanation_zh: "The cat 第三人称单数。" },
    { type: "sentence_choice", options: ["She don't know.", "She doesn't know.", "She not know."], answer: "She doesn't know.", explanation_zh: "第三人称单数否定用 doesn't。" },
    { type: "word_form", prompt_en: "Mary (watch) TV every night.", answer: "watches", explanation_zh: "第三人称单数，watch 加 -es。" },
    { type: "fill_choice", question_en: "Birds ____ in the sky.", options: ["fly", "flies"], answer: "fly", explanation_zh: "Birds 复数，谓语用原形。" },
    { type: "sentence_correction", question_en: "Jane like apples.", answer: "Jane likes apples.", explanation_zh: "第三人称单数谓语加 -s。" },
    { type: "fill_choice", question_en: "The dog ____ loudly.", options: ["bark", "barks"], answer: "barks", explanation_zh: "The dog 第三人称单数。" },
    { type: "word_form", prompt_en: "She (study) at home.", answer: "studies", explanation_zh: "第三人称单数，study 变 studies。" },
    { type: "fill_choice", question_en: "Students ____ homework.", options: ["do", "does"], answer: "do", explanation_zh: "Students 复数。" },
    { type: "sentence_correction", question_en: "He don't like it.", answer: "He doesn't like it.", explanation_zh: "第三人称单数否定用 doesn't。" },
    { type: "word_form", prompt_en: "The baby (cry) every night.", answer: "cries", explanation_zh: "第三人称单数，cry 变 cries。" },
    { type: "fill_choice", question_en: "It ____ rain often here.", options: ["rain", "rains"], answer: "rains", explanation_zh: "It 第三人称单数。" },
  ],
  6: [
    { type: "fill_choice", question_en: "He ____ home late.", options: ["came", "comes"], answer: "came", explanation_zh: "过去时用 came。" },
    { type: "sentence_correction", question_en: "She tell me yesterday.", answer: "She told me yesterday.", explanation_zh: "tell 的过去式为 told。" },
    { type: "word_form", prompt_en: "I (give) him a book.", answer: "gave", explanation_zh: "give 的过去式为 gave。" },
  ],
  7: [
    { type: "fill_choice", question_en: "They ____ now.", options: ["are working", "work"], answer: "are working", explanation_zh: "现在进行时。" },
    { type: "sentence_correction", question_en: "He is write a letter.", answer: "He is writing a letter.", explanation_zh: "进行时用 writing。" },
  ],
  8: [
    { type: "fill_choice", question_en: "She ____ when I arrived.", options: ["was sleeping", "is sleeping"], answer: "was sleeping", explanation_zh: "过去进行时。" },
  ],
  9: [
    { type: "fill_choice", question_en: "I ____ that film.", options: ["have seen", "saw"], answer: "have seen", explanation_zh: "现在完成时。" },
  ],
  10: [
    { type: "fill_choice", question_en: "We ____ next week.", options: ["will go", "went"], answer: "will go", explanation_zh: "将来时。" },
  ],
  11: [
    { type: "fill_choice", question_en: "The committee ____ agreed.", options: ["has", "have"], answer: "has", explanation_zh: "集体名词作整体用单数。" },
  ],
  12: [
    { type: "fill_choice", question_en: "You ____ try harder.", options: ["should", "can"], answer: "should", explanation_zh: "should 表建议。" },
  ],
};

// Duplicate from existing questions for modules 5-12 to reach 33
function duplicateWithVariation(existing, mod, name) {
  const out = [];
  const needed = TARGET - (byModule[mod] || 0);
  let idx = 0;
  for (let i = 0; i < needed; i++) {
    const src = existing[idx % existing.length];
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = `q${nextId++}`;
    copy.module = mod;
    copy.module_name_zh = name;
    out.push(copy);
    idx++;
  }
  return out;
}

for (let mod = 2; mod <= 12; mod++) {
  const need = TARGET - (byModule[mod] || 0);
  if (need <= 0) continue;
  const name = MODULE_NAMES[mod];
  const existing = questions.filter((q) => q.module === mod);

  if (EXTRAS[mod] && EXTRAS[mod].length >= need) {
    EXTRAS[mod].slice(0, need).forEach((q) => {
      const base = { id: `q${nextId++}`, layer: 1, module: mod, module_name_zh: name, difficulty: 1 };
      if (q.type === "judgement") questions.push({ ...base, type: "judgement", instruction_zh: "这个名词是可数还是不可数？", ...q });
      else if (q.type === "fill_choice") questions.push({ ...base, type: "fill_choice", instruction_zh: "请选择正确的词", ...q });
      else if (q.type === "sentence_choice") questions.push({ ...base, type: "sentence_choice", instruction_zh: "请选择语法正确的句子", ...q });
      else if (q.type === "sentence_correction") questions.push({ ...base, type: "sentence_correction", instruction_zh: "请修改以下句子中的错误", ...q });
      else if (q.type === "word_form") questions.push({ ...base, type: "word_form", instruction_zh: "请写出正确形式", prompt_en: q.prompt_en, answer: q.answer, explanation_zh: q.explanation_zh });
    });
  } else if (mod === 2) {
    const add = [
      { type: "word_form", prompt_en: "wife", answer: "wives", explanation_zh: "以 -fe 结尾，f 变 v 加 -s。" },
      { type: "fill_choice", question_en: "Many ____ attended.", options: ["delegate", "delegates"], answer: "delegates", explanation_zh: "Many 后接复数。" },
      { type: "sentence_choice", options: ["Two sheep were in the field.", "Two sheeps were in the field.", "Two sheep was in the field."], answer: "Two sheep were in the field.", explanation_zh: "sheep 单复数同形。" },
      { type: "word_form", prompt_en: "half", answer: "halves", explanation_zh: "以 -f 结尾，f 变 v 加 -es。" },
      { type: "sentence_correction", question_en: "I have two brother.", answer: "I have two brothers.", explanation_zh: "Two 后接复数。" },
      { type: "fill_choice", question_en: "A few ____ flew over.", options: ["goose", "geese"], answer: "geese", explanation_zh: "goose 不规则复数为 geese。" },
      { type: "word_form", prompt_en: "hero", answer: "heroes", explanation_zh: "以 -o 结尾，加 -es。" },
      { type: "sentence_choice", options: ["The data shows progress.", "The data show progress.", "The datas shows progress."], answer: "The data shows progress.", explanation_zh: "data 常作不可数。" },
    ];
    add.forEach((q) => {
      const base = { id: `q${nextId++}`, layer: 1, module: 2, module_name_zh: "名词复数", difficulty: 1 };
      if (q.type === "word_form") questions.push({ ...base, ...q, instruction_zh: "请写出下列名词的复数形式" });
      else if (q.type === "fill_choice") questions.push({ ...base, ...q, instruction_zh: "请选择正确的词" });
      else if (q.type === "sentence_choice") questions.push({ ...base, ...q, instruction_zh: "请选择语法正确的句子" });
      else questions.push({ ...base, ...q, instruction_zh: "请修改以下句子中的错误" });
    });
  } else if (mod === 4) {
    const add = [
      { type: "fill_choice", question_en: "It took ____ hour.", options: ["a", "an"], answer: "an", explanation_zh: "hour 以元音音素开头。" },
      { type: "sentence_correction", question_en: "She is a engineer.", answer: "She is an engineer.", explanation_zh: "engineer 以元音音素开头。" },
      { type: "fill_choice", question_en: "____ moon is full.", options: ["A", "The"], answer: "The", explanation_zh: "moon 独一无二用 the。" },
      { type: "sentence_correction", question_en: "I saw a elephant.", answer: "I saw an elephant.", explanation_zh: "elephant 以元音音素开头。" },
      { type: "fill_choice", question_en: "She is ____ American.", options: ["a", "an"], answer: "an", explanation_zh: "American 以元音音素开头。" },
      { type: "sentence_choice", options: ["Open the door.", "Open a door.", "Open door."], answer: "Open the door.", explanation_zh: "特指用 the。" },
      { type: "sentence_correction", question_en: "It is an one-way street.", answer: "It is a one-way street.", explanation_zh: "one 以辅音音素开头。" },
      { type: "fill_choice", question_en: "____ earth is round.", options: ["A", "The"], answer: "The", explanation_zh: "earth 独一无二用 the。" },
    ];
    add.forEach((q) => {
      const base = { id: `q${nextId++}`, layer: 1, module: 4, module_name_zh: "冠词 (a / an / the)", difficulty: 1 };
      questions.push({ ...base, ...q, instruction_zh: q.options ? "请选择正确的冠词" : q.question_en?.includes("?") ? "请修改以下句子中的错误" : "请选择语法正确的句子" });
    });
  } else if (EXTRAS[mod]) {
    const used = Math.min(need, EXTRAS[mod].length);
    EXTRAS[mod].slice(0, used).forEach((q) => {
      const base = { id: `q${nextId++}`, layer: 1, module: mod, module_name_zh: name, difficulty: 1 };
      if (q.type === "judgement") questions.push({ ...base, type: "judgement", instruction_zh: "这个名词是可数还是不可数？", ...q });
      else if (q.type === "fill_choice") questions.push({ ...base, type: "fill_choice", instruction_zh: "请选择正确的词", ...q });
      else if (q.type === "sentence_choice") questions.push({ ...base, type: "sentence_choice", instruction_zh: "请选择语法正确的句子", ...q });
      else if (q.type === "sentence_correction") questions.push({ ...base, type: "sentence_correction", instruction_zh: "请修改以下句子中的错误", ...q });
      else if (q.type === "word_form") questions.push({ ...base, type: "word_form", instruction_zh: "请写出正确形式", ...q });
    });
    const remain = need - used;
    if (remain > 0 && existing.length > 0) {
      for (let i = 0; i < remain; i++) {
        const src = existing[i % existing.length];
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = `q${nextId++}`;
        questions.push(copy);
      }
    }
  } else if (existing.length > 0) {
    for (let i = 0; i < need; i++) {
      const src = existing[i % existing.length];
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = `q${nextId++}`;
      questions.push(copy);
    }
  }
}

const final = {};
questions.forEach((q) => { final[q.module] = (final[q.module] || 0) + 1; });
fs.writeFileSync(dataPath, JSON.stringify(questions, null, 2) + "\n", "utf-8");
console.log("Done. Counts per module:", final);
